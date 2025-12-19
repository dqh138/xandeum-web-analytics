'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, HardDrive, TrendingUp, Database, PieChart } from 'lucide-react';
import { fetchNetworkHistory, fetchPNodes } from '@/lib/api';
import { MetricCard } from '@/components/ui/MetricCard';
import { NoDataState } from '@/components/ui/EmptyState';
import { MetricCardSkeleton, TableSkeleton } from '@/components/ui/Skeleton';
import { StorageTrendsChart } from '@/components/StorageTrendsChart';
import { formatBytes, formatPercentage, safePercentage } from '@/lib/format';

export default function StorageDashboard() {
    const [nodes, setNodes] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [nodesData, historyData] = await Promise.all([
                    fetchPNodes(),
                    fetchNetworkHistory(48), // Last 48 snapshots
                ]);
                setNodes(nodesData || []);
                setHistory(historyData || []);
            } catch (err) {
                console.error('Failed to load storage data', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Calculate storage metrics safely
    const totalCommitted = nodes.reduce((sum, n) => sum + (n.current_metrics?.storage_committed || 0), 0);
    const totalUsed = nodes.reduce((sum, n) => sum + (n.current_metrics?.storage_used || 0), 0);
    const avgUsage = safePercentage(
        nodes.reduce((sum, n) => sum + (n.current_metrics?.storage_usage_percent || 0), 0),
        nodes.length
    );
    const activeNodes = nodes.filter(n => n.status === 'online').length;

    // Calculate trends from history
    let committedTrend = 0;
    let usedTrend = 0;
    if (history.length >= 2) {
        const sorted = [...history].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const latest = sorted[sorted.length - 1];
        const prev = sorted[sorted.length - 2];
        if (latest && prev) {
            if (prev.storage?.total_committed > 0) {
                committedTrend = ((latest.storage.total_committed - prev.storage.total_committed) / prev.storage.total_committed) * 100;
            }
            if (prev.storage?.total_used > 0) {
                usedTrend = ((latest.storage.total_used - prev.storage.total_used) / prev.storage.total_used) * 100;
            }
        }
    }

    // Storage distribution
    const storageRanges = {
        '0-100GB': nodes.filter(n => (n.current_metrics?.storage_committed || 0) < 100e9).length,
        '100GB-1TB': nodes.filter(n => {
            const s = n.current_metrics?.storage_committed || 0;
            return s >= 100e9 && s < 1e12;
        }).length,
        '1TB-10TB': nodes.filter(n => {
            const s = n.current_metrics?.storage_committed || 0;
            return s >= 1e12 && s < 10e12;
        }).length,
        '10TB+': nodes.filter(n => (n.current_metrics?.storage_committed || 0) >= 10e12).length,
    };

    // Top storage nodes
    const topNodes = [...nodes]
        .sort((a, b) => (b.current_metrics?.storage_committed || 0) - (a.current_metrics?.storage_committed || 0))
        .slice(0, 10);

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
                        <HardDrive className="text-purple-500" />
                        Storage Analytics
                    </h1>
                    <p className="mt-2 text-slate-400">Comprehensive storage capacity and usage analysis</p>
                </div>

                {/* Overview Stats */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {loading ? (
                        <>
                            <MetricCardSkeleton />
                            <MetricCardSkeleton />
                            <MetricCardSkeleton />
                            <MetricCardSkeleton />
                        </>
                    ) : (
                        <>
                            <MetricCard
                                label="Total Committed"
                                value={formatBytes(totalCommitted)}
                                icon={Database}
                                color="purple"
                                trend={{ value: committedTrend, label: 'vs last snapshot' }}
                                isEmpty={totalCommitted === 0}
                                emptyMessage="No storage committed yet"
                            />
                            <MetricCard
                                label="Total Used"
                                value={formatBytes(totalUsed)}
                                icon={HardDrive}
                                color="blue"
                                trend={{ value: usedTrend, label: 'vs last snapshot' }}
                                isEmpty={totalUsed === 0}
                                emptyMessage="No storage used yet"
                            />
                            <MetricCard
                                label="Average Usage"
                                value={formatPercentage(avgUsage, { decimals: 2 })}
                                icon={TrendingUp}
                                color="green"
                                isEmpty={avgUsage === 0}
                                emptyMessage="Calculating..."
                            />
                            <MetricCard
                                label="Active Nodes"
                                value={activeNodes}
                                icon={PieChart}
                                color="emerald"
                                isEmpty={activeNodes === 0}
                                emptyMessage="No active nodes"
                            />
                        </>
                    )}
                </div>

                {/* New: Storage Trends Chart */}
                <div className="grid gap-6">
                    <StorageTrendsChart history={history} />
                </div>

                {/* Storage Distribution */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                    <h2 className="mb-6 text-xl font-semibold text-white">Storage Distribution</h2>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="space-y-2">
                                    <div className="h-4 w-32 animate-pulse rounded bg-slate-800" />
                                    <div className="h-2 w-full animate-pulse rounded bg-slate-800" />
                                </div>
                            ))}
                        </div>
                    ) : nodes.length === 0 ? (
                        <NoDataState message="No storage data available yet" />
                    ) : (
                        <div className="space-y-4">
                            {Object.entries(storageRanges).map(([range, count]) => {
                                const percentage = safePercentage(count, nodes.length);
                                return (
                                    <div key={range}>
                                        <div className="mb-2 flex items-center justify-between text-sm">
                                            <span className="text-slate-400">{range}</span>
                                            <span className="font-medium text-white">
                                                {count} nodes ({formatPercentage(percentage, { decimals: 1 })})
                                            </span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Top Storage Nodes */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                    <h2 className="mb-6 text-xl font-semibold text-white">Top 10 Storage Providers</h2>

                    {loading ? (
                        <TableSkeleton rows={10} columns={6} />
                    ) : topNodes.length === 0 ? (
                        <NoDataState message="No nodes with storage data available" />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-slate-800 text-xs uppercase text-slate-500">
                                    <tr>
                                        <th className="pb-3">Rank</th>
                                        <th className="pb-3">Node ID</th>
                                        <th className="pb-3">Committed</th>
                                        <th className="pb-3">Used</th>
                                        <th className="pb-3">Usage %</th>
                                        <th className="pb-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {topNodes.map((node, index) => (
                                        <tr key={node.node_id} className="text-slate-300 transition-colors hover:bg-slate-800/30">
                                            <td className="py-3 font-medium text-purple-400">#{index + 1}</td>
                                            <td className="py-3 font-mono text-xs">
                                                <Link href={`/nodes/${node.node_id}`} className="hover:text-blue-400">
                                                    {node.node_id.slice(0, 8)}...{node.node_id.slice(-8)}
                                                </Link>
                                            </td>
                                            <td className="py-3">
                                                {formatBytes(node.current_metrics?.storage_committed)}
                                            </td>
                                            <td className="py-3">
                                                {formatBytes(node.current_metrics?.storage_used)}
                                            </td>
                                            <td className="py-3">
                                                {formatPercentage(node.current_metrics?.storage_usage_percent, { decimals: 2 })}
                                            </td>
                                            <td className="py-3">
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${node.status === 'online'
                                                    ? 'bg-emerald-500/10 text-emerald-400'
                                                    : 'bg-red-500/10 text-red-400'
                                                    }`}>
                                                    {node.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
