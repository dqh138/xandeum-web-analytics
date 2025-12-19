'use client';

import { useState, useEffect } from 'react';
import { fetchPNodes } from '@/lib/api';
import { NodeTable } from '@/components/NodeTable';
import { Trophy } from 'lucide-react';

export default function LeaderboardPage() {
    const [nodes, setNodes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await fetchPNodes();
                setNodes(data);
            } catch (err) {
                console.error('Failed to fetch nodes', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    return (
        <main className="min-h-screen bg-slate-950 p-6 md:p-12">
            <div className="mx-auto max-w-7xl space-y-8">
                <header>
                    <h1 className="flex items-center gap-3 bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-4xl font-bold text-transparent">
                        <Trophy className="h-8 w-8 text-blue-500" />
                        Network Leaderboard
                    </h1>
                    <p className="mt-2 text-slate-400">
                        Rankings and detailed status of all participating nodes.
                    </p>
                </header>

                {loading ? (
                    <div className="flex h-64 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50">
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                            <p className="text-slate-400">Loading leaderboard data...</p>
                        </div>
                    </div>
                ) : (
                    <NodeTable nodes={nodes} />
                )}

                <footer className="mt-20 border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
                    <p>© 2025 Xandeum Analytics. Data updates in real-time.</p>
                </footer>
            </div>
        </main>
    );
}
