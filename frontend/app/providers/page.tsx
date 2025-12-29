'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, TrendingUp, Server, HardDrive, Copy, CheckSquare, Square, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchProviders } from '@/lib/api';
import { MetricCard } from '@/components/ui/MetricCard';
import { MetricCardSkeleton } from '@/components/ui/Skeleton';
import { NoDataState } from '@/components/ui/EmptyState';
import { formatBytes } from '@/lib/format';
import { useSidebar } from '@/context/SidebarContext';
import { cn } from '@/lib/utils';

export default function ProvidersDashboard() {
    const [providers, setProviders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'storage' | 'nodes' | 'uptime'>('storage');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showCompare, setShowCompare] = useState(false);
    const { isCollapsed } = useSidebar();

    const [itemsPerPage, setItemsPerPage] = useState(7);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const loadData = async () => {
            try {
                const providersData = await fetchProviders();
                setProviders(providersData);
            } catch (err) {
                console.error('Failed to load providers', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const toggleSelection = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            if (selectedIds.length >= 3) return; // Max 3
            setSelectedIds([...selectedIds, id]);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Toast would go here
    };

    const sortedProviders = [...providers].sort((a, b) => {
        switch (sortBy) {
            case 'storage':
                return (b.metrics?.total_storage_committed || 0) - (a.metrics?.total_storage_committed || 0);
            case 'nodes':
                return (b.nodes?.total_count || 0) - (a.nodes?.total_count || 0);
            case 'uptime':
                return (b.metrics?.average_uptime_hours || 0) - (a.metrics?.average_uptime_hours || 0);
            default:
                return 0;
        }
    });

    // Reset pagination when data or sort changes
    useEffect(() => {
        setCurrentPage(1);
    }, [providers, sortBy, itemsPerPage]); // Added itemsPerPage dependency

    const totalPages = Math.ceil(sortedProviders.length / itemsPerPage);
    const paginatedProviders = sortedProviders.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // ... (rest, need to update the pagination controls part)

    const totalStorage = providers.reduce((sum, p) => sum + (p.metrics?.total_storage_committed || 0), 0);
    const totalNodes = providers.reduce((sum, p) => sum + (p.nodes?.total_count || 0), 0);
    const avgUptime = providers.length > 0
        ? providers.reduce((sum, p) => sum + (p.metrics?.average_uptime_hours || 0), 0) / providers.length
        : 0;

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-900">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
        );
    }

    // Comparison View
    if (showCompare && selectedIds.length > 0) {
        const compareData = providers.filter(p => selectedIds.includes(p.provider_id));
        return (
            <main className={cn(
                "min-h-screen p-6 md:p-12 transition-all duration-300 bg-slate-950",
                isCollapsed ? "lg:pl-28" : "lg:pl-72"
            )}>
                <div className="mx-auto max-w-7xl space-y-8">
                    <button
                        onClick={() => setShowCompare(false)}
                        className="flex items-center gap-2 text-slate-600 dark:text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white"
                    >
                        <ArrowLeft size={16} /> Back to List
                    </button>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Provider Comparison</h1>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {compareData.map(p => (
                            <div key={p.provider_id} className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-800/50 p-6">
                                <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">{p.provider_name}</h2>
                                <div className="space-y-4">
                                    <div className="flex justify-between border-b border-slate-300 dark:border-slate-700 pb-2">
                                        <span className="text-slate-600 dark:text-slate-600 dark:text-slate-400">Nodes</span>
                                        <span className="font-mono text-slate-900 dark:text-white">{p.nodes?.total_count || 0}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-300 dark:border-slate-700 pb-2">
                                        <span className="text-slate-600 dark:text-slate-600 dark:text-slate-400">Total Storage</span>
                                        <span className="font-mono text-slate-900 dark:text-white">{formatBytes(p.metrics?.total_storage_committed || 0)}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-300 dark:border-slate-700 pb-2">
                                        <span className="text-slate-600 dark:text-slate-600 dark:text-slate-400">Storage Used</span>
                                        <span className="font-mono text-slate-900 dark:text-white">{formatBytes(p.metrics?.total_storage_used || 0)}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-300 dark:border-slate-700 pb-2">
                                        <span className="text-slate-600 dark:text-slate-600 dark:text-slate-400">Avg Uptime</span>
                                        <span className="font-mono text-slate-900 dark:text-white">{(p.metrics?.average_uptime_hours || 0).toFixed(1)}h</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-300 dark:border-slate-700 pb-2">
                                        <span className="text-slate-600 dark:text-slate-600 dark:text-slate-400">Avg CPU</span>
                                        <span className="font-mono text-slate-900 dark:text-white">{(p.metrics?.average_cpu_percent || 0).toFixed(1)}%</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className={cn(
            "min-h-screen p-6 md:p-12 transition-all duration-300 bg-slate-950",
            isCollapsed ? "lg:pl-28" : "lg:pl-72"
        )}>
            <div className="mx-auto max-w-7xl space-y-8">
                {/* Header */}
                <div>
                    <Link
                        href="/"
                        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-600 dark:text-slate-400 transition-colors hover:text-slate-900 dark:text-white"
                    >
                        <ArrowLeft size={16} />
                        Back to Dashboard
                    </Link>

                    <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900 dark:text-white">
                        <Building2 className="text-purple-500" />
                        Provider Analytics
                    </h1>
                    <p className="mt-2 text-slate-600 dark:text-slate-600 dark:text-slate-400">Comprehensive provider comparison and rankings</p>
                </div>

                {/* Overview Stats */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        label="Total Providers"
                        value={providers.length}
                        icon={Building2}
                        color="purple"
                    />
                    <MetricCard
                        label="Total Storage"
                        value={formatBytes(totalStorage)}
                        icon={HardDrive}
                        color="blue"
                    />
                    <MetricCard
                        label="Total Nodes"
                        value={totalNodes}
                        icon={Server}
                        color="green"
                    />
                    <MetricCard
                        label="Avg Uptime"
                        value={`${avgUptime.toFixed(1)}h`}
                        icon={TrendingUp}
                        color="orange"
                    />
                </div>

                {/* Controls */}
                <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900/50 p-4 backdrop-blur-sm sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-600 dark:text-slate-400">Sort by:</span>
                        <div className="flex gap-2">
                            {[
                                { key: 'storage', label: 'Storage' },
                                { key: 'nodes', label: 'Nodes' },
                                { key: 'uptime', label: 'Uptime' }
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setSortBy(key as any)}
                                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${sortBy === key
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-700'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-slate-600 dark:text-slate-600 dark:text-slate-400">{selectedIds.length} selected</span>
                            <button
                                onClick={() => setShowCompare(true)}
                                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-slate-900 dark:text-white hover:bg-purple-500"
                            >
                                Compare ({selectedIds.length})
                            </button>
                            <button
                                onClick={() => setSelectedIds([])}
                                className="text-slate-600 dark:text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Provider List */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                    {providers.length === 0 ? (
                        <NoDataState message="No providers found. Add providers to see analytics." />
                    ) : (
                        <div className="space-y-4">
                            {paginatedProviders.map((provider, index) => {
                                // Calculate global index for correct ranking #
                                const globalIndex = (currentPage - 1) * itemsPerPage + index;
                                const storagePercent = totalStorage > 0
                                    ? ((provider.metrics?.total_storage_committed || 0) / totalStorage) * 100
                                    : 0;
                                const isSelected = selectedIds.includes(provider.provider_id);

                                return (
                                    <div
                                        key={provider.provider_id}
                                        onClick={() => toggleSelection(provider.provider_id)}
                                        className={`group relative cursor-pointer rounded-lg border p-5 transition-all ${isSelected
                                            ? 'border-purple-500 bg-purple-500/10'
                                            : 'border-slate-800/50 bg-slate-50 dark:bg-slate-800/30 hover:border-slate-700 hover:bg-slate-800/50'
                                            }`}
                                    >
                                        <div className="absolute right-4 top-4">
                                            {isSelected ? <CheckSquare className="text-purple-500" /> : <Square className="text-slate-600 dark:text-slate-500 dark:text-slate-600 group-hover:text-slate-600 dark:text-slate-600 dark:text-slate-400" />}
                                        </div>

                                        <div className="flex items-start justify-between gap-4 pr-10">
                                            <div className="flex items-start gap-4">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-lg font-bold text-slate-600 dark:text-slate-400">
                                                    #{globalIndex + 1}
                                                </div>

                                                <div>
                                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{provider.provider_name}</h3>
                                                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-600 dark:text-slate-400">
                                                        <div
                                                            className="flex items-center gap-2 hover:text-slate-900 dark:text-white"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                copyToClipboard(provider.identification?.ip_ranges?.[0] || '');
                                                            }}
                                                        >
                                                            <span className="text-slate-600 dark:text-slate-600 dark:text-slate-500">IP Range:</span>
                                                            <span className="font-mono text-slate-700 dark:text-slate-300">
                                                                {provider.identification?.ip_ranges?.[0] || 'N/A'}
                                                            </span>
                                                            <Copy size={12} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                                    {formatBytes(provider.metrics?.total_storage_committed || 0)}
                                                </div>
                                                <div className="mt-1 text-xs text-slate-600 dark:text-slate-600 dark:text-slate-500">
                                                    {storagePercent.toFixed(1)}% of network
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-700/50 pt-4 md:grid-cols-4">
                                            <div>
                                                <div className="text-xs text-slate-600 dark:text-slate-600 dark:text-slate-500">Nodes</div>
                                                <div className="mt-1 font-semibold text-slate-900 dark:text-white">
                                                    {provider.nodes?.total_count || 0}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="text-xs text-slate-600 dark:text-slate-600 dark:text-slate-500">Avg Uptime</div>
                                                <div className="mt-1 font-semibold text-slate-900 dark:text-white">
                                                    {(provider.metrics?.average_uptime_hours || 0).toFixed(1)}h
                                                </div>
                                            </div>

                                            <div>
                                                <div className="text-xs text-slate-600 dark:text-slate-600 dark:text-slate-500">Avg CPU</div>
                                                <div className="mt-1 font-semibold text-slate-900 dark:text-white">
                                                    {(provider.metrics?.average_cpu_percent || 0).toFixed(1)}%
                                                </div>
                                            </div>

                                            <div>
                                                <div className="text-xs text-slate-600 dark:text-slate-600 dark:text-slate-500">Storage Used</div>
                                                <div className="mt-1 font-semibold text-slate-900 dark:text-white">
                                                    {formatBytes(provider.metrics?.total_storage_used || 0)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Storage bar */}
                                        <div className="mt-4">
                                            <div className="mb-1 flex justify-between text-xs text-slate-600 dark:text-slate-600 dark:text-slate-500">
                                                <span>Network Share</span>
                                                <span>{storagePercent.toFixed(2)}%</span>
                                            </div>
                                            <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                                                    style={{ width: `${Math.min(storagePercent, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {providers.length > 0 && (
                        <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-700/50 pt-4">

                            {/* Left: Info & Size Selector */}
                            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                                <p className="text-sm text-slate-400">
                                    Showing <span className="font-medium text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-white">{Math.min(currentPage * itemsPerPage, providers.length)}</span> of <span className="font-medium text-white">{providers.length}</span> providers
                                </p>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                    className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300 focus:border-purple-500 focus:outline-none cursor-pointer"
                                    title="Items per page"
                                >
                                    {[7, 14, 21, 50].map(n => (
                                        <option key={n} value={n}>{n} / page</option>
                                    ))}
                                </select>
                            </div>

                            {/* Right: Page Navigation */}
                            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-2 md:pb-0 scrollbar-hide">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    title="Previous Page"
                                >
                                    <ChevronLeft size={16} />
                                </button>

                                {/* Page Numbers Logic inside render */}
                                {(() => {
                                    const delta = 1;
                                    const range = [];
                                    const rangeWithDots = [];

                                    for (let i = 1; i <= totalPages; i++) {
                                        if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
                                            range.push(i);
                                        }
                                    }

                                    let l;
                                    for (let i of range) {
                                        if (l) {
                                            if (i - l === 2) {
                                                rangeWithDots.push(l + 1);
                                            } else if (i - l !== 1) {
                                                rangeWithDots.push('...');
                                            }
                                        }
                                        rangeWithDots.push(i);
                                        l = i;
                                    }

                                    return rangeWithDots.map((page, idx) => (
                                        page === '...' ? (
                                            <span key={`dots-${idx}`} className="px-1 text-slate-600 text-xs">...</span>
                                        ) : (
                                            <button
                                                key={`page-${page}`}
                                                onClick={() => setCurrentPage(Number(page))}
                                                className={`min-w-[28px] h-7 flex items-center justify-center rounded-md text-xs font-medium transition-colors ${currentPage === page
                                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20'
                                                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent hover:border-slate-700'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        )
                                    ));
                                })()}

                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    title="Next Page"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
