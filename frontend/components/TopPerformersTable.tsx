'use client';

import { Medal, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface TopPerformer {
    node_id: string;
    performance_score: number;
    address: string;
    geo?: {
        country?: string;
    };
}

interface TopPerformersTableProps {
    nodes: TopPerformer[];
    limit?: number;
}

export function TopPerformersTable({ nodes, limit = 5 }: TopPerformersTableProps) {
    // Sort by performance_score and take top N
    const topNodes = [...nodes]
        .filter(n => n.performance_score && n.performance_score > 0)
        .sort((a, b) => (b.performance_score || 0) - (a.performance_score || 0))
        .slice(0, limit);

    const getMedalColor = (index: number) => {
        if (index === 0) return 'text-yellow-400';
        if (index === 1) return 'text-slate-300';
        if (index === 2) return 'text-amber-600';
        return 'text-slate-600';
    };

    const getScoreColor = (score: number) => {
        if (score >= 0.9) return 'text-emerald-400 bg-emerald-500/10';
        if (score >= 0.7) return 'text-blue-400 bg-blue-500/10';
        if (score >= 0.5) return 'text-yellow-400 bg-yellow-500/10';
        return 'text-slate-400 bg-slate-500/10';
    };

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-200">Top Performers</h3>
                <Link
                    href="/leaderboard"
                    className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                    View All
                    <ExternalLink size={14} />
                </Link>
            </div>

            <div className="space-y-3">
                {topNodes.map((node, index) => (
                    <Link
                        key={node.node_id}
                        href={`/nodes/${node.node_id}`}
                        className="block rounded-lg border border-slate-800 bg-slate-950/50 p-4 transition-all hover:border-blue-500/50 hover:bg-slate-800/50"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Medal className={cn('h-5 w-5', getMedalColor(index))} />
                                <div>
                                    <div className="font-mono text-sm text-slate-200">
                                        {node.node_id.slice(0, 8)}...{node.node_id.slice(-6)}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {node.geo?.country || 'Unknown'} • {node.address}
                                    </div>
                                </div>
                            </div>

                            <div className={cn(
                                'rounded-lg px-3 py-1.5 font-mono text-sm font-bold',
                                getScoreColor(node.performance_score)
                            )}>
                                {node.performance_score.toFixed(3)}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {topNodes.length === 0 && (
                <div className="py-8 text-center text-sm text-slate-500">
                    No performance data available
                </div>
            )}
        </div>
    );
}
