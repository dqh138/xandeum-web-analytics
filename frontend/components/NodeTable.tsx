'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, ShieldCheck, AlertCircle, Medal, Star } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useStarredNodes } from '@/hooks/useStarredNodes';

interface Node {
    node_id: string;
    address: string;
    status: string;
    version: string;
    is_public: boolean;
    rpc_port: number;
    geo?: {
        country?: string;
        city?: string;
    };
    performance_score?: number;
}

interface NodeTableProps {
    nodes: Node[];
}

type SortKey = 'node_id' | 'status' | 'version' | 'country' | 'performance_score';
type SortDirection = 'asc' | 'desc';

export function NodeTable({ nodes }: NodeTableProps) {
    const { starredIds, toggleStar, isStarred } = useStarredNodes();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
        key: 'performance_score',
        direction: 'desc',
    });

    const handleSort = (key: SortKey) => {
        setSortConfig((current) => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    // Pre-calculate ranks based on performance_score
    const rankMap = useMemo(() => {
        const sorted = [...nodes].sort((a, b) => (b.performance_score || 0) - (a.performance_score || 0));
        const map = new Map<string, number>();
        sorted.forEach((node, index) => {
            map.set(node.node_id, index + 1);
        });
        return map;
    }, [nodes]);

    const filteredAndSortedNodes = useMemo(() => {
        let result = [...nodes];

        // 1. Filter by Search
        if (search) {
            const lowerSearch = search.toLowerCase();
            result = result.filter(
                (node) =>
                    node.node_id.toLowerCase().includes(lowerSearch) ||
                    node.address.toLowerCase().includes(lowerSearch) ||
                    node.geo?.country?.toLowerCase().includes(lowerSearch)
            );
        }

        // 2. Filter by Status
        if (statusFilter !== 'all') {
            result = result.filter((node) => node.status === statusFilter);
        }

        // 3. Sort
        result.sort((a, b) => {
            let aValue: string | number = '';
            let bValue: string | number = '';

            switch (sortConfig.key) {
                case 'node_id':
                    aValue = a.node_id;
                    bValue = b.node_id;
                    break;
                case 'status':
                    // Custom sort priority: Online > Offline
                    aValue = a.status === 'online' ? 2 : 1;
                    bValue = b.status === 'online' ? 2 : 1;
                    break;
                case 'version':
                    aValue = a.version;
                    bValue = b.version;
                    break;
                case 'country':
                    aValue = a.geo?.country || '';
                    bValue = b.geo?.country || '';
                    break;
                case 'performance_score':
                    aValue = a.performance_score || 0;
                    bValue = b.performance_score || 0;
                    break;
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [nodes, search, statusFilter, sortConfig]);

    const SortIcon = ({ column }: { column: SortKey }) => {
        if (sortConfig.key !== column) return <ArrowUpDown size={14} className="ml-1 text-slate-600" />;
        return sortConfig.direction === 'asc' ? (
            <ArrowUp size={14} className="ml-1 text-blue-400" />
        ) : (
            <ArrowDown size={14} className="ml-1 text-blue-400" />
        );
    };

    return (
        <div className="space-y-4">
            {/* Controls Bar */}
            <div className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search by Node ID, Address, or Country..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-slate-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                    >
                        <option value="all">All Status</option>
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                    </select>
                    <div className="ml-2 text-xs text-slate-500">
                        {filteredAndSortedNodes.length} nodes found
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-950/50 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="px-6 py-4 font-semibold w-12 text-center">
                                    <Star size={14} className="mx-auto text-slate-500" />
                                </th>
                                <th className="px-6 py-4 font-semibold w-16 text-center">#</th>
                                <th
                                    className="cursor-pointer px-6 py-4 font-semibold hover:text-slate-300"
                                    onClick={() => handleSort('node_id')}
                                >
                                    <div className="flex items-center">Node ID <SortIcon column="node_id" /></div>
                                </th>
                                <th
                                    className="cursor-pointer px-6 py-4 font-semibold hover:text-slate-300"
                                    onClick={() => handleSort('status')}
                                >
                                    <div className="flex items-center">Status <SortIcon column="status" /></div>
                                </th>
                                <th
                                    className="cursor-pointer px-6 py-4 font-semibold hover:text-slate-300"
                                    onClick={() => handleSort('performance_score')}
                                >
                                    <div className="flex items-center">Score <SortIcon column="performance_score" /></div>
                                </th>
                                <th
                                    className="cursor-pointer px-6 py-4 font-semibold hover:text-slate-300"
                                    onClick={() => handleSort('country')}
                                >
                                    <div className="flex items-center">Country <SortIcon column="country" /></div>
                                </th>
                                <th
                                    className="cursor-pointer px-6 py-4 font-semibold hover:text-slate-300"
                                    onClick={() => handleSort('version')}
                                >
                                    <div className="flex items-center">Version <SortIcon column="version" /></div>
                                </th>
                                <th className="px-6 py-4 font-semibold">Address</th>
                                <th className="px-6 py-4 font-semibold text-right">RPC Port</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {filteredAndSortedNodes.length > 0 ? (
                                filteredAndSortedNodes.map((node, index) => (
                                    <tr key={node.node_id} className="hover:bg-slate-800/30 transition-colors">

                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => toggleStar(node.node_id)}
                                                className="text-slate-500 hover:text-yellow-400 transition-colors"
                                            >
                                                <Star
                                                    size={16}
                                                    className={cn("mx-auto transition-all", isStarred(node.node_id) ? "fill-yellow-400 text-yellow-400" : "")}
                                                />
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {(() => {
                                                const rank = rankMap.get(node.node_id) || 0;
                                                return (
                                                    <>
                                                        {rank === 1 && <Medal className="h-5 w-5 text-yellow-400 mx-auto" />}
                                                        {rank === 2 && <Medal className="h-5 w-5 text-slate-300 mx-auto" />}
                                                        {rank === 3 && <Medal className="h-5 w-5 text-amber-600 mx-auto" />}
                                                        {rank > 3 && <span className="font-mono text-slate-500">{rank}</span>}
                                                    </>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-slate-200">
                                            <Link href={`/nodes/${node.node_id}`} className="hover:text-blue-400 hover:underline transition-colors">
                                                {node.node_id.slice(0, 8)}...{node.node_id.slice(-8)}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={cn(
                                                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                                                node.status === 'online'
                                                    ? "bg-emerald-500/10 text-emerald-400"
                                                    : "bg-red-500/10 text-red-400"
                                            )}>
                                                {node.status === 'online' ? <ShieldCheck size={12} /> : <AlertCircle size={12} />}
                                                {node.status.toUpperCase()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {(() => {
                                                const score = node.performance_score || 0;
                                                let colorClass = "text-red-400";
                                                if (score > 0.9) colorClass = "text-emerald-400";
                                                else if (score >= 0.5) colorClass = "text-yellow-400";

                                                return (
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-800">
                                                            <div
                                                                className={cn("h-full rounded-full transition-all", score > 0.9 ? "bg-emerald-500" : score >= 0.5 ? "bg-yellow-500" : "bg-red-500")}
                                                                style={{ width: `${score * 100}%` }}
                                                            />
                                                        </div>
                                                        <span className={cn("font-mono font-bold", colorClass)}>
                                                            {score.toFixed(2)}
                                                        </span>
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-6 py-4">
                                            {node.geo?.country || <span className="text-slate-600 italic">Unknown</span>}
                                            {node.geo?.city && <span className="text-xs text-slate-500 block">{node.geo.city}</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="rounded bg-slate-800 px-2 py-1 font-mono text-xs text-slate-300">
                                                {node.version}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs truncate max-w-[150px]" title={node.address}>
                                            {node.address}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-xs">
                                            {node.rpc_port}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        No nodes found matching your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
