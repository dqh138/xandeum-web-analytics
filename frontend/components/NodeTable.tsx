'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, ShieldCheck, AlertCircle, Medal, Star, ChevronLeft, ChevronRight, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
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
    const { toggleStar, isStarred } = useStarredNodes();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
    const [countryFilter, setCountryFilter] = useState<string>('all');
    const [scoreFilter, setScoreFilter] = useState<string>('all');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    // Toast
    const { showToast } = useToast();

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

    const handleStar = (id: string) => {
        const currentlyStarred = isStarred(id);
        toggleStar(id);

        if (currentlyStarred) {
            showToast("Node removed from Starred list", "info");
        } else {
            showToast("Node added to Starred ⭐", "success");
        }
    };

    const uniqueCountries = useMemo(() => {
        const countries = new Set(nodes.map(n => n.geo?.country).filter(Boolean));
        return Array.from(countries).sort();
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

        // 3. Filter by Country
        if (countryFilter !== 'all') {
            result = result.filter((node) => node.geo?.country === countryFilter);
        }

        // 4. Filter by Score
        if (scoreFilter !== 'all') {
            result = result.filter((node) => {
                const score = node.performance_score || 0;
                if (scoreFilter === 'high') return score >= 0.9;
                if (scoreFilter === 'medium') return score >= 0.5 && score < 0.9;
                if (scoreFilter === 'low') return score < 0.5;
                return true;
            });
        }

        // 5. Sort
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
    }, [nodes, search, statusFilter, countryFilter, scoreFilter, sortConfig]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredAndSortedNodes.length / itemsPerPage);
    const paginatedNodes = filteredAndSortedNodes.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page when filters change
    useMemo(() => setCurrentPage(1), [search, statusFilter, countryFilter, scoreFilter]);

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
            <div className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4 backdrop-blur-sm">

                {/* Search */}
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search by Node ID, Address, or Country..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center text-slate-400 text-sm mr-2">
                        <Filter size={16} className="mr-2" /> Filters:
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                    >
                        <option value="all">All Status</option>
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                    </select>

                    <select
                        value={countryFilter}
                        onChange={(e) => setCountryFilter(e.target.value)}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none max-w-[150px]"
                    >
                        <option value="all">All Countries</option>
                        {uniqueCountries.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>

                    <select
                        value={scoreFilter}
                        onChange={(e) => setScoreFilter(e.target.value)}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                    >
                        <option value="all">All Scores</option>
                        <option value="high">High (&gt;0.9)</option>
                        <option value="medium">Medium (0.5-0.9)</option>
                        <option value="low">Low (&lt;0.5)</option>
                    </select>

                    {(statusFilter !== 'all' || countryFilter !== 'all' || scoreFilter !== 'all' || search) && (
                        <button
                            onClick={() => {
                                setSearch('');
                                setStatusFilter('all');
                                setCountryFilter('all');
                                setScoreFilter('all');
                            }}
                            className="ml-auto flex items-center gap-1 text-xs text-slate-400 hover:text-white"
                        >
                            <X size={12} /> Clear all
                        </button>
                    )}
                </div>

                <div className="text-right text-xs text-slate-500">
                    Showing {paginatedNodes.length} of {filteredAndSortedNodes.length} nodes
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
                            {paginatedNodes.length > 0 ? (
                                paginatedNodes.map((node, index) => {
                                    // Calculate global rank based on original sorted result if needed, 
                                    // but usually rank is just current index in sorted list.
                                    // However, since we paginate, the index is (page-1)*50 + index.
                                    const globalRank = (currentPage - 1) * itemsPerPage + index + 1;

                                    return (
                                        <tr key={node.node_id} className="hover:bg-slate-800/30 transition-colors">

                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleStar(node.node_id)}
                                                    className="text-slate-500 hover:text-yellow-400 transition-colors"
                                                >
                                                    <Star
                                                        size={16}
                                                        className={cn("mx-auto transition-all", isStarred(node.node_id) ? "fill-yellow-400 text-yellow-400" : "")}
                                                    />
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {globalRank === 1 && <Medal className="h-5 w-5 text-yellow-400 mx-auto" />}
                                                {globalRank === 2 && <Medal className="h-5 w-5 text-slate-300 mx-auto" />}
                                                {globalRank === 3 && <Medal className="h-5 w-5 text-amber-600 mx-auto" />}
                                                {globalRank > 3 && <span className="font-mono text-slate-500">{globalRank}</span>}
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
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                                        No nodes found matching your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/30 px-6 py-4">
                        <div className="text-sm text-slate-500">
                            Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={14} /> Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>


        </div>
    );
}
