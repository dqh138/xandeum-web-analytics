'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, TrendingUp, Server, HardDrive } from 'lucide-react';
import { fetchProviders } from '@/lib/api';

export default function ProvidersDashboard() {
    const [providers, setProviders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'storage' | 'nodes' | 'uptime'>('storage');

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

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-900">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
        );
    }

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

    const totalStorage = providers.reduce((sum, p) => sum + (p.metrics?.total_storage_committed || 0), 0);
    const totalNodes = providers.reduce((sum, p) => sum + (p.nodes?.total_count || 0), 0);
    const avgUptime = providers.length > 0
        ? providers.reduce((sum, p) => sum + (p.metrics?.average_uptime_hours || 0), 0) / providers.length
        : 0;

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
                        <Building2 className="text-purple-500" />
                        Provider Analytics
                    </h1>
                    <p className="mt-2 text-slate-400">Comprehensive provider comparison and rankings</p>
                </div>

                {/* Overview Stats */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-3 text-slate-400">
                            <Building2 className="h-5 w-5" />
                            <span className="text-sm font-medium">Total Providers</span>
                        </div>
                        <p className="mt-3 text-3xl font-bold text-white">{providers.length}</p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-3 text-slate-400">
                            <HardDrive className="h-5 w-5" />
                            <span className="text-sm font-medium">Total Storage</span>
                        </div>
                        <p className="mt-3 text-3xl font-bold text-white">{(totalStorage / 1e12).toFixed(2)} TB</p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-3 text-slate-400">
                            <Server className="h-5 w-5" />
                            <span className="text-sm font-medium">Total Nodes</span>
                        </div>
                        <p className="mt-3 text-3xl font-bold text-white">{totalNodes}</p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-3 text-slate-400">
                            <TrendingUp className="h-5 w-5" />
                            <span className="text-sm font-medium">Avg Uptime</span>
                        </div>
                        <p className="mt-3 text-3xl font-bold text-white">{avgUptime.toFixed(1)}h</p>
                    </div>
                </div>

                {/* Sort Controls */}
                <div className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4 backdrop-blur-sm">
                    <span className="text-sm font-medium text-slate-400">Sort by:</span>
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
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Top Providers */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                    <h2 className="mb-6 text-xl font-semibold text-white">Provider Rankings</h2>

                    <div className="space-y-4">
                        {sortedProviders.map((provider, index) => {
                            const storagePercent = totalStorage > 0
                                ? ((provider.metrics?.total_storage_committed || 0) / totalStorage) * 100
                                : 0;

                            return (
                                <div
                                    key={provider.provider_id}
                                    className="rounded-lg border border-slate-800/50 bg-slate-800/30 p-5 transition-all hover:border-slate-700 hover:bg-slate-800/50"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 text-lg font-bold text-purple-400">
                                                #{index + 1}
                                            </div>

                                            <div>
                                                <h3 className="text-lg font-semibold text-white">{provider.provider_name}</h3>
                                                <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-400">
                                                    <div>
                                                        <span className="text-slate-500">IP Range:</span>
                                                        <span className="ml-2 font-mono text-slate-300">
                                                            {provider.identification?.ip_ranges?.[0] || 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-purple-400">
                                                {((provider.metrics?.total_storage_committed || 0) / 1e12).toFixed(2)} TB
                                            </div>
                                            <div className="mt-1 text-xs text-slate-500">
                                                {storagePercent.toFixed(1)}% of network
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-700/50 pt-4 md:grid-cols-4">
                                        <div>
                                            <div className="text-xs text-slate-500">Nodes</div>
                                            <div className="mt-1 font-semibold text-white">
                                                {provider.nodes?.total_count || 0}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {provider.nodes?.active_count || 0} active
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-xs text-slate-500">Avg Uptime</div>
                                            <div className="mt-1 font-semibold text-white">
                                                {(provider.metrics?.average_uptime_hours || 0).toFixed(1)}h
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-xs text-slate-500">Avg CPU</div>
                                            <div className="mt-1 font-semibold text-white">
                                                {(provider.metrics?.average_cpu_percent || 0).toFixed(1)}%
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-xs text-slate-500">Storage Used</div>
                                            <div className="mt-1 font-semibold text-white">
                                                {((provider.metrics?.total_storage_used || 0) / 1e9).toFixed(2)} GB
                                            </div>
                                        </div>
                                    </div>

                                    {/* Storage bar */}
                                    <div className="mt-4">
                                        <div className="mb-1 flex justify-between text-xs text-slate-500">
                                            <span>Network Share</span>
                                            <span>{storagePercent.toFixed(2)}%</span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
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
                </div>
            </div>
        </main>
    );
}
