'use client';

import { useEffect, useState } from 'react';
import { NodeTable } from '@/components/NodeTable';
import { fetchPNodes } from '@/lib/api';
import { Star, AlertCircle, Loader2 } from 'lucide-react';
import { useStarredNodes } from '@/hooks/useStarredNodes';

export default function StarredPage() {
    const [nodes, setNodes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { starredIds } = useStarredNodes();

    useEffect(() => {
        const loadNodes = async () => {
            try {
                const data = await fetchPNodes();
                setNodes(data);
            } catch (err) {
                console.error('Failed to fetch nodes', err);
                setError('Failed to load network nodes');
            } finally {
                setLoading(false);
            }
        };

        loadNodes();
    }, []);

    const starredNodes = nodes.filter(node => starredIds.includes(node.node_id));

    return (
        <main className="min-h-screen bg-slate-950 p-6 md:p-12">
            <div className="mx-auto max-w-7xl space-y-8">
                <header>
                    <h1 className="flex items-center gap-3 bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-4xl font-bold text-transparent">
                        <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
                        Starred Nodes
                    </h1>
                    <p className="mt-2 text-slate-400">
                        Monitor your favorite network nodes in one place.
                    </p>
                </header>

                {error && (
                    <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-red-500">
                        <div className="flex items-center gap-2">
                            <AlertCircle size={20} />
                            <p className="font-medium">Error loading data</p>
                        </div>
                        <p className="mt-1 text-sm opacity-90">{error}</p>
                    </div>
                )}

                {loading ? (
                    <div className="flex h-64 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            <p className="text-sm text-slate-400">Loading starred nodes...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {starredNodes.length > 0 ? (
                            <NodeTable nodes={starredNodes} />
                        ) : (
                            <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 text-center">
                                <div className="rounded-full bg-slate-800 p-4">
                                    <Star className="h-8 w-8 text-slate-600" />
                                </div>
                                <h3 className="mt-4 text-lg font-medium text-white">No starred nodes yet</h3>
                                <p className="mt-2 text-sm text-slate-400">
                                    Go to the Leaderboard or Node Details to star nodes.
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
