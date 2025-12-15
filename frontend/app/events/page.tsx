'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Filter, AlertCircle, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { fetchEvents } from '@/lib/api';

export default function EventsDashboard() {
    const [events, setEvents] = useState<any[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

    useEffect(() => {
        const loadData = async () => {
            try {
                const eventsData = await fetchEvents(200);
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
        setFilteredEvents(filtered);
    }, [selectedCategory, selectedSeverity, events]);

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
        switch (severity) {
            case 'critical':
            case 'error':
                return <AlertCircle className="h-5 w-5 text-red-400" />;
            case 'warning':
                return <AlertTriangle className="h-5 w-5 text-orange-400" />;
            case 'info':
            default:
                return <Info className="h-5 w-5 text-blue-400" />;
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical':
                return 'bg-red-500/10 text-red-400 border-red-500/30';
            case 'error':
                return 'bg-red-500/10 text-red-400 border-red-500/30';
            case 'warning':
                return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
            case 'info':
            default:
                return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
        }
    };

    // Event statistics
    const eventsByCategory = categories.slice(1).map(cat => ({
        category: cat,
        count: events.filter(e => e.category === cat).length
    }));

    const eventsBySeverity = severities.slice(1).map(sev => ({
        severity: sev,
        count: events.filter(e => e.severity === sev).length
    }));

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

                    <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
                        <Calendar className="text-blue-500" />
                        Events Timeline
                    </h1>
                    <p className="mt-2 text-slate-400">Network activity and event monitoring</p>
                </div>

                {/* Statistics */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-3 text-slate-400">
                            <Calendar className="h-5 w-5" />
                            <span className="text-sm font-medium">Total Events</span>
                        </div>
                        <p className="mt-3 text-3xl font-bold text-white">{events.length}</p>
                    </div>

                    {eventsBySeverity.slice(0, 3).map(({ severity, count }) => (
                        <div key={severity} className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                            <div className="flex items-center gap-3 text-slate-400">
                                {getIcon(severity)}
                                <span className="text-sm font-medium capitalize">{severity}</span>
                            </div>
                            <p className="mt-3 text-3xl font-bold text-white">{count}</p>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-400">Filters:</span>
                    </div>

                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        {severities.map(sev => (
                            <option key={sev} value={sev}>
                                {sev === 'all' ? 'All Severities' : sev.charAt(0).toUpperCase() + sev.slice(1)}
                            </option>
                        ))}
                    </select>

                    <div className="ml-auto text-sm text-slate-400">
                        Showing {filteredEvents.length} of {events.length} events
                    </div>
                </div>

                {/* Events Timeline */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                    <h2 className="mb-6 text-xl font-semibold text-white">Event Log</h2>

                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {filteredEvents.length === 0 ? (
                            <p className="py-8 text-center text-slate-500">No events match the selected filters.</p>
                        ) : (
                            filteredEvents.map((event) => (
                                <div
                                    key={event.event_id}
                                    className="flex gap-4 rounded-lg border border-slate-800/50 bg-slate-800/30 p-4 transition-colors hover:border-slate-700"
                                >
                                    <div className="mt-1">{getIcon(event.severity)}</div>

                                    <div className="flex-1">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="font-medium text-slate-200">{event.details.message}</p>
                                                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 ${getSeverityColor(event.severity)}`}>
                                                        {event.severity.toUpperCase()}
                                                    </span>
                                                    <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-slate-400">
                                                        {event.category.toUpperCase()}
                                                    </span>
                                                    <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-slate-400">
                                                        {event.type}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="text-right text-xs text-slate-500" suppressHydrationWarning>
                                                <div>{new Date(event.timestamp).toLocaleDateString()}</div>
                                                <div>{new Date(event.timestamp).toLocaleTimeString()}</div>
                                            </div>
                                        </div>

                                        {event.details.old_value !== undefined && event.details.new_value !== undefined && (
                                            <div className="mt-3 rounded border border-slate-700/50 bg-slate-900/50 p-3 text-xs">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <span className="text-slate-500">Previous:</span>
                                                        <span className="ml-2 font-mono text-slate-300">{JSON.stringify(event.details.old_value)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500">Current:</span>
                                                        <span className="ml-2 font-mono text-slate-300">{JSON.stringify(event.details.new_value)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-2 font-mono text-xs text-slate-500">
                                            Node: {event.node_id.slice(0, 16)}...
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
