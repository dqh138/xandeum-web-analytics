'use client';

import { useEffect, useState } from 'react';
import { NodeTable } from '@/components/NodeTable';
import { fetchPNodes } from '@/lib/api';
import { Star, AlertCircle, Loader2, LayoutGrid, List, Check } from 'lucide-react';
import { useStarredNodes } from '@/hooks/useStarredNodes';
import { NoDataState } from '@/components/ui/EmptyState';
import { MetricCard } from '@/components/ui/MetricCard';
import { formatBytes } from '@/lib/format';

export default function StarredPage() {
    const [nodes, setNodes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'compare'>('list');
    const { starredIds, toggleStar } = useStarredNodes();

    useEffect(() => {
        const loadNodes = async () => {
            try {
                const data = await fetchPNodes();
                setNodes(data);
            } catch (err) {
                console.error('Failed to fetch nodes', err);
            } finally {
                setLoading(false);
            }
        };

        loadNodes();
    }, []);

    const starredNodes = nodes.filter(node => starredIds.includes(node.node_id));

    // Stats for Starred
    const avgScore = starredNodes.length > 0
        ? starredNodes.reduce((acc, curr) => acc + (curr.performance_score || 0), 0) / starredNodes.length
        : 0;

    const totalUptime = starredNodes.length > 0
        ? starredNodes.reduce((acc, curr) => acc + (curr.metrics?.uptime_current || 0), 0) / starredNodes.length
        : 0; // Using placeholder metric field if not mapped correctly, check logic.
    // fetchPNodes returns standard node objects.
    // Let's assume we want average score.

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-900">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <main className="min-h-screen p-6 md:p-12">
            <div className="mx-auto max-w-7xl space-y-8">
                {/* Header */}
                <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
                            <Star className="text-yellow-500 fill-yellow-500" />
                            Starred Nodes
                        </h1>
                        <p className="mt-2 text-slate-400">
                            Monitor and compare your favorite network nodes.
                        </p>
                    </div>

                    {starredNodes.length > 0 && (
                        <div className="flex rounded-lg border border-slate-700 bg-slate-800 p-1">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                <List size={16} /> List
                            </button>
                            <button
                                onClick={() => setViewMode('compare')}
                                className={`flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === 'compare' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                <LayoutGrid size={16} /> Compare
                            </button>
                        </div>
                    )}
                </header>

                {starredNodes.length > 0 && (
                    <div className="grid gap-6 sm:grid-cols-3">
                        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                            <h3 className="text-sm font-medium text-slate-400">Tracked Nodes</h3>
                            <p className="mt-2 text-3xl font-bold text-white">{starredNodes.length}</p>
                        </div>
                        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                            <h3 className="text-sm font-medium text-slate-400">Avg Performance</h3>
                            <p className="mt-2 text-3xl font-bold text-emerald-400">{avgScore.toFixed(2)}</p>
                        </div>
                        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                            <h3 className="text-sm font-medium text-slate-400">Online Status</h3>
                            <p className="mt-2 text-3xl font-bold text-blue-400">
                                {starredNodes.filter(n => n.status === 'online').length}/{starredNodes.length}
                            </p>
                        </div>
                    </div>
                )}

                {starredNodes.length === 0 ? (
                    <NoDataState
                        message="You haven't starred any nodes yet."
                        description="Go to the Leaderboard to find nodes to track."
                    />
                ) : (
                    <>
                        {viewMode === 'list' ? (
                            <NodeTable nodes={starredNodes} />
                        ) : (
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {starredNodes.map(node => (
                                    <div key={node.node_id} className="relative rounded-xl border border-slate-700 bg-slate-800/50 p-6 transition-all hover:border-slate-600">

                                        <div className="absolute right-4 top-4">
                                            <button
                                                onClick={() => toggleStar(node.node_id)}
                                                className="text-yellow-500 hover:text-yellow-600"
                                            >
                                                <Star className="fill-yellow-500" size={20} />
                                            </button>
                                        </div>

                                        <h3 className="pr-8 text-lg font-bold text-white truncate" title={node.node_id}>
                                            {node.node_id}
                                        </h3>

                                        <div className="mt-4 space-y-4">
                                            <div className="flex justify-between border-b border-slate-700/50 pb-2">
                                                <span className="text-sm text-slate-400">Status</span>
                                                <span className={`text-sm font-medium ${node.status === 'online' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {node.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between border-b border-slate-700/50 pb-2">
                                                <span className="text-sm text-slate-400">Score</span>
                                                <span className="text-sm font-medium text-white">{(node.performance_score || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-slate-700/50 pb-2">
                                                <span className="text-sm text-slate-400">Country</span>
                                                <span className="text-sm font-medium text-white">{node.geo?.country || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-slate-700/50 pb-2">
                                                <span className="text-sm text-slate-400">Version</span>
                                                <span className="text-sm font-medium text-white">{node.version}</span>
                                            </div>
                                            <div className="flex justify-between pt-1">
                                                <span className="text-sm text-slate-400">Address</span>
                                                <span className="text-xs font-mono text-slate-500 truncate max-w-[150px]">{node.address}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
