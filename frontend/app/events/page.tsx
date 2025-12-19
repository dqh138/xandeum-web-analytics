'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Filter, AlertCircle, Info, AlertTriangle, Search, Download } from 'lucide-react';
import { fetchEvents } from '@/lib/api';
import { MetricCard } from '@/components/ui/MetricCard';
import { MetricCardSkeleton } from '@/components/ui/Skeleton';

export default function EventsDashboard() {
    const [events, setEvents] = useState<any[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                const eventsData = await fetchEvents(500); // Increased limit for search utility
                setEvents(eventsData);
                setFilteredEvents(eventsData);
            } catch (err) {
                console.error('Failed to load events', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        let filtered = events;
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(e => e.category === selectedCategory);
        }
        if (selectedSeverity !== 'all') {
            filtered = filtered.filter(e => e.severity === selectedSeverity);
        }
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(e =>
                e.details.message.toLowerCase().includes(lowerQuery) ||
                e.node_id.toLowerCase().includes(lowerQuery) ||
                e.type.toLowerCase().includes(lowerQuery)
            );
        }
        setFilteredEvents(filtered);
    }, [selectedCategory, selectedSeverity, searchQuery, events]);

    const handleExportCSV = () => {
        if (filteredEvents.length === 0) return;

        const headers = ['Timestamp', 'Severity', 'Category', 'Type', 'Node ID', 'Message'];
        const csvContent = [
            headers.join(','),
            ...filteredEvents.map(e => [
                new Date(e.timestamp).toISOString(),
                e.severity,
                e.category,
                e.type,
                e.node_id,
                `"${e.details.message.replace(/"/g, '""')}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `events_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-900">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
        );
    }

    const categories = ['all', ...Array.from(new Set(events.map(e => e.category)))];
    const severities = ['all', 'info', 'warning', 'error', 'critical'];

    const getIcon = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'critical':
            case 'error':
                return <AlertCircle className="h-5 w-5 text-red-500" />;
            case 'warning':
                return <AlertTriangle className="h-5 w-5 text-orange-500" />;
            case 'info':
            default:
                return <Info className="h-5 w-5 text-blue-500" />;
        }
    };

    const getSeverityStyles = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'critical':
            case 'error':
                return 'bg-red-500/10 text-red-400 border-red-500/20';
            case 'warning':
                return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
            case 'info':
            default:
                return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        }
    };

    // Stats Logic
    const criticalCount = events.filter(e => e.severity === 'critical' || e.severity === 'error').length;
    const warningCount = events.filter(e => e.severity === 'warning').length;
    const infoCount = events.filter(e => e.severity === 'info').length;

    return (
        <main className="min-h-screen p-6 md:p-12">
            <div className="mx-auto max-w-7xl space-y-8">
                {/* Header */}
                <div>
                    <Link
                        href="/"
                        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
                    >
                        <ArrowLeft size={16} />
                        Back to Dashboard
                    </Link>

                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div>
                            <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
                                <Calendar className="text-blue-500" />
                                Events Timeline
                            </h1>
                            <p className="mt-2 text-slate-400">Network monitoring events log</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-2xl font-bold text-white">{filteredEvents.length}</p>
                                <p className="text-xs text-slate-400">Filtered Events</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        label="Total Events"
                        value={events.length}
                        icon={Calendar}
                        color="blue"
                    />
                    <MetricCard
                        label="Critical Errors"
                        value={criticalCount}
                        icon={AlertCircle}
                        color="red"
                        trend={{ value: 0, label: 'Attention needed' }}
                    />
                    <MetricCard
                        label="Warnings"
                        value={warningCount}
                        icon={AlertTriangle}
                        color="orange"
                    />
                    <MetricCard
                        label="Info Messages"
                        value={infoCount}
                        icon={Info}
                        color="green"
                    />
                </div>

                {/* Filters & Controls */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 backdrop-blur-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Filter className="h-4 w-4" />
                            <span className="text-sm font-medium">Filters:</span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>
                                        {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={selectedSeverity}
                                onChange={(e) => setSelectedSeverity(e.target.value)}
                                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                            >
                                {severities.map(sev => (
                                    <option key={sev} value={sev}>
                                        {sev === 'all' ? 'All Severities' : sev.charAt(0).toUpperCase() + sev.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Search Bar */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search by message, node ID, or type..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-lg border border-slate-700 bg-slate-800 pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                            />
                        </div>

                        {/* Export Button */}
                        <button
                            onClick={handleExportCSV}
                            disabled={filteredEvents.length === 0}
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download className="h-4 w-4" />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Events List */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                    <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                        {filteredEvents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                                <Search className="mb-4 h-12 w-12 opacity-20" />
                                <p>No events match your current filters.</p>
                            </div>
                        ) : (
                            filteredEvents.map((event) => (
                                <div
                                    key={event.event_id}
                                    className="flex gap-4 rounded-lg border border-slate-800/50 bg-slate-800/30 p-4 transition-all hover:border-slate-700 hover:bg-slate-800/50"
                                >
                                    <div className="mt-1 flex-shrink-0">{getIcon(event.severity)}</div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                            <div className="space-y-1">
                                                <p className="font-medium text-slate-200">{event.details.message}</p>
                                                <div className="flex flex-wrap gap-2 text-xs">
                                                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-medium ${getSeverityStyles(event.severity)}`}>
                                                        {event.severity.toUpperCase()}
                                                    </span>
                                                    <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800/50 px-2 py-0.5 text-slate-400">
                                                        {event.category.toUpperCase()}
                                                    </span>
                                                    <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800/50 px-2 py-0.5 text-slate-400">
                                                        {event.type}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex-shrink-0 text-xs text-slate-500 md:text-right font-mono">
                                                <div suppressHydrationWarning>{new Date(event.timestamp).toLocaleDateString()}</div>
                                                <div suppressHydrationWarning>{new Date(event.timestamp).toLocaleTimeString()}</div>
                                            </div>
                                        </div>

                                        {event.details.old_value !== undefined && event.details.new_value !== undefined && (
                                            <div className="mt-3 grid gap-2 rounded border border-slate-700/50 bg-slate-900/50 p-3 text-xs md:grid-cols-2">
                                                <div>
                                                    <span className="text-slate-500">Previous:</span>
                                                    <code className="ml-2 block rounded bg-slate-950/50 p-1 text-red-300">
                                                        {JSON.stringify(event.details.old_value)}
                                                    </code>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">New Value:</span>
                                                    <code className="ml-2 block rounded bg-slate-950/50 p-1 text-emerald-300">
                                                        {JSON.stringify(event.details.new_value)}
                                                    </code>
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-2 truncate font-mono text-xs text-slate-600">
                                            Node ID: <span className="select-all hover:text-slate-400">{event.node_id}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
