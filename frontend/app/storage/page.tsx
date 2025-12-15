'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, HardDrive, TrendingUp, Database, PieChart } from 'lucide-react';
import { fetchNetworkHistory, fetchPNodes } from '@/lib/api';

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
                setNodes(nodesData);
                setHistory(historyData);
            } catch (err) {
                console.error('Failed to load storage data', err);
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

    // Calculate storage metrics
    const totalCommitted = nodes.reduce((sum, n) => sum + (n.current_metrics?.storage_committed || 0), 0);
    const totalUsed = nodes.reduce((sum, n) => sum + (n.current_metrics?.storage_used || 0), 0);
    const avgUsage = nodes.length > 0
        ? nodes.reduce((sum, n) => sum + (n.current_metrics?.storage_usage_percent || 0), 0) / nodes.length
        : 0;

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
                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-3 text-slate-400">
                            <Database className="h-5 w-5" />
                            <span className="text-sm font-medium">Total Committed</span>
                        </div>
                        <p className="mt-3 text-3xl font-bold text-white">
                            {(totalCommitted / 1e12).toFixed(2)} TB
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-3 text-slate-400">
                            <HardDrive className="h-5 w-5" />
                            <span className="text-sm font-medium">Total Used</span>
                        </div>
                        <p className="mt-3 text-3xl font-bold text-white">
                            {(totalUsed / 1e9).toFixed(2)} GB
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-3 text-slate-400">
                            <TrendingUp className="h-5 w-5" />
                            <span className="text-sm font-medium">Average Usage</span>
                        </div>
                        <p className="mt-3 text-3xl font-bold text-white">
                            {avgUsage.toFixed(4)}%
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-3 text-slate-400">
                            <PieChart className="h-5 w-5" />
                            <span className="text-sm font-medium">Active Nodes</span>
                        </div>
                        <p className="mt-3 text-3xl font-bold text-white">
                            {nodes.filter(n => n.status === 'online').length}
                        </p>
                    </div>
                </div>

                {/* Storage Distribution */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                    <h2 className="mb-6 text-xl font-semibold text-white">Storage Distribution</h2>
                    <div className="space-y-4">
                        {Object.entries(storageRanges).map(([range, count]) => {
                            const percentage = nodes.length > 0 ? (count / nodes.length) * 100 : 0;
                            return (
                                <div key={range}>
                                    <div className="mb-2 flex items-center justify-between text-sm">
                                        <span className="text-slate-400">{range}</span>
                                        <span className="font-medium text-white">{count} nodes ({percentage.toFixed(1)}%)</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Top Storage Nodes */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                    <h2 className="mb-6 text-xl font-semibold text-white">Top 10 Storage Providers</h2>
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
                                    <tr key={node.node_id} className="text-slate-300 hover:bg-slate-800/30">
                                        <td className="py-3 font-medium text-purple-400">#{index + 1}</td>
                                        <td className="py-3 font-mono text-xs">
                                            <Link href={`/nodes/${node.node_id}`} className="hover:text-blue-400">
                                                {node.node_id.slice(0, 8)}...{node.node_id.slice(-8)}
                                            </Link>
                                        </td>
                                        <td className="py-3">{((node.current_metrics?.storage_committed || 0) / 1e9).toFixed(2)} GB</td>
                                        <td className="py-3">{((node.current_metrics?.storage_used || 0) / 1e9).toFixed(2)} GB</td>
                                        <td className="py-3">{(node.current_metrics?.storage_usage_percent || 0).toFixed(4)}%</td>
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
                </div>
            </div>
        </main>
    );
}
