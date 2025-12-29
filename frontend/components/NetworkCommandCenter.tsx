'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, Copy, ChevronRight, Circle, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GeoMap } from './GeoMap';
import { cn } from '@/lib/utils';

interface Node {
    node_id: string;
    status: string;
    geo?: {
        latitude?: number;
        longitude?: number;
        city?: string;
        country?: string;
        country_code?: string;
    };
    version?: string;
    uptime?: number;
}

interface NetworkCommandCenterProps {
    nodes: Node[];
}

// Helper to get country code from name
const getCountryCode = (countryName?: string) => {
    const map: Record<string, string> = {
        'United States': 'US',
        'France': 'FR',
        'Germany': 'DE',
        'United Kingdom': 'GB',
        'Japan': 'JP',
        'Singapore': 'SG',
        'Australia': 'AU',
        'Canada': 'CA',
        'Netherlands': 'NL',
        'Ireland': 'IE',
        'India': 'IN',
        'Brazil': 'BR',
        'South Korea': 'KR',
        'Unknown': 'UN'
    };
    return map[countryName || ''] || 'UN'; // UN for Unknown/World
};

// Helper to convert country code to emoji flag
const getFlagEmoji = (countryCode?: string, countryName?: string) => {
    let code = countryCode;
    if (!code) {
        code = getCountryCode(countryName);
    }

    // If still unknown or 'UN', return generic globe
    if (code === 'UN' || !code) return '🌐';

    const codePoints = code
        .toUpperCase()
        .split('')
        .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
};

// Simulation of "Old Ver" detection
const LATEST_VERSION = "2.2.0";

export function NetworkCommandCenter({ nodes }: NetworkCommandCenterProps) {
    const [filter, setFilter] = useState<'all' | 'online' | 'offline'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCountry, setSelectedCountry] = useState<string>('All');

    // Get unique countries for filter
    const uniqueCountries = useMemo(() => {
        const countries = new Set(nodes.map(n => n.geo?.country).filter(Boolean));
        return ['All', ...Array.from(countries).sort()];
    }, [nodes]);

    // Filter nodes logic
    const filteredNodes = useMemo(() => {
        return nodes.filter(node => {
            const matchesSearch = node.node_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                node.geo?.city?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = filter === 'all'
                ? true
                : filter === 'online'
                    ? node.status === 'online'
                    : node.status !== 'online';

            const matchesCountry = selectedCountry === 'All'
                ? true
                : node.geo?.country === selectedCountry;

            return matchesSearch && matchesStatus && matchesCountry;
        });
    }, [nodes, filter, searchQuery, selectedCountry]);

    const stats = useMemo(() => {
        // ... previous stats logic ...
        return {
            total: nodes.length,
            online: nodes.filter(n => n.status === 'online').length,
            offline: nodes.filter(n => n.status !== 'online').length
        };
    }, [nodes]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[800px]">
            {/* LEFT SIDE: MAP (Takes 2/3 width) */}
            <div className="lg:col-span-2 h-full">
                <GeoMap nodes={filteredNodes} />
            </div>

            {/* RIGHT SIDE: NODE LIST PANEL (Takes 1/3 width) */}
            <div className="lg:col-span-1 h-full flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">

                {/* 1. Header & Search Area */}
                <div className="p-4 space-y-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
                    {/* Top Row: Search + Filter Tabs */}
                    <div className="flex flex-col gap-3">
                        {/* Search Input */}
                        <div className="relative group w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search nodes by ID or City..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-800 rounded-lg py-2.5 pl-9 pr-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-slate-900 transition-all font-sans"
                            />
                        </div>

                        {/* Filters Row */}
                        <div className="flex items-center justify-between gap-2">
                            {/* Filter Tabs (All / Online / Offline) */}
                            <div className="flex bg-slate-900/50 rounded-lg p-1 border border-slate-800">
                                <button
                                    onClick={() => setFilter('all')}
                                    className={cn("px-4 py-1.5 text-xs font-medium rounded-md transition-all", filter === 'all' ? "bg-slate-800 text-white shadow-sm ring-1 ring-slate-700" : "text-slate-500 hover:text-slate-400")}
                                >All</button>
                                <button
                                    onClick={() => setFilter('online')}
                                    className={cn("px-4 py-1.5 text-xs font-medium rounded-md transition-all", filter === 'online' ? "bg-emerald-500/10 text-emerald-400 shadow-sm ring-1 ring-emerald-500/20" : "text-slate-500 hover:text-slate-400")}
                                >Online</button>
                                <button
                                    onClick={() => setFilter('offline')}
                                    className={cn("px-4 py-1.5 text-xs font-medium rounded-md transition-all", filter === 'offline' ? "bg-red-500/10 text-red-400 shadow-sm ring-1 ring-red-500/20" : "text-slate-500 hover:text-slate-400")}
                                >Offline</button>
                            </div>

                            {/* Country Filter Dropdown */}
                            <div className="relative">
                                <select
                                    value={selectedCountry}
                                    onChange={(e) => setSelectedCountry(e.target.value)}
                                    className="appearance-none bg-slate-900/50 border border-slate-800 text-slate-400 text-xs font-medium rounded-lg px-3 py-2 pr-8 hover:bg-slate-800 hover:text-slate-200 transition-colors focus:outline-none focus:border-slate-600 cursor-pointer w-28"
                                >
                                    {uniqueCountries.map(c => (
                                        <option key={c} value={c}>{c === 'All' ? 'All Countries' : c}</option>
                                    ))}
                                </select>
                                <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Legend / Status Badges Row - CLEAN VERSION */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 px-1">
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="px-1.5 py-0.5 rounded-[4px] text-[10px] bg-slate-800 text-slate-400 border border-slate-700/50 font-medium">Healthy</span>
                            <span>Online & Latest Ver</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="px-1.5 py-0.5 rounded-[4px] text-[10px] bg-amber-900/20 text-amber-500 border border-amber-900/30 font-medium">Old Ver</span>
                            <span>Outdated</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="px-1.5 py-0.5 rounded-[4px] text-[10px] bg-red-900/20 text-red-500 border border-red-900/30 font-medium">Critical</span>
                            <span>Offline</span>
                        </div>
                    </div>
                </div>

                {/* 2. Scrollable Node List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    {filteredNodes.length > 0 ? (
                        filteredNodes.map((node) => {
                            const isOnline = node.status === 'online';
                            const isLatest = (node.version || 'v2.2.0') === LATEST_VERSION;
                            const isHealthy = isOnline && isLatest;

                            return (
                                <div
                                    key={node.node_id}
                                    className="group flex items-center justify-between p-3 rounded-xl hover:bg-slate-900/60 border border-transparent hover:border-slate-800/60 transition-all cursor-pointer"
                                >
                                    {/* Left: Indicator + Info */}
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        {/* Status Dot */}
                                        <div className="relative flex-shrink-0">
                                            <div className={cn("w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]", isOnline ? "bg-emerald-500 shadow-emerald-500/50" : "bg-red-500 shadow-red-500/50")} />
                                        </div>

                                        {/* Text Info */}
                                        <div className="flex flex-col min-w-0">
                                            {/* Top Line: ID + Badges + Copy */}
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-sm text-slate-200 truncate max-w-[100px]" title={node.node_id}>
                                                    {node.node_id.slice(0, 8)}...
                                                </span>

                                                {/* Healthy Badge */}
                                                {isHealthy && (
                                                    <span className="px-1.5 py-0.5 rounded-[4px] text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700/50">
                                                        Healthy
                                                    </span>
                                                )}

                                                {/* Old Version Badge */}
                                                {!isLatest && isOnline && (
                                                    <span className="px-1.5 py-0.5 rounded-[4px] text-[10px] font-medium bg-amber-900/20 text-amber-500 border border-amber-900/30">
                                                        Old Ver
                                                    </span>
                                                )}

                                                <Copy className="w-3 h-3 text-slate-600 hover:text-slate-400 cursor-pointer hidden group-hover:block transition-colors" />
                                            </div>

                                            {/* Bottom Line: Flag + City */}
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                                                <span className="text-base leading-none select-none filter grayscale-[0.3] group-hover:grayscale-0 transition-all">
                                                    {getFlagEmoji(node.geo?.country_code, node.geo?.country)}
                                                </span>
                                                <span className="truncate group-hover:text-slate-400 transition-colors">
                                                    {node.geo?.city || 'Unknown Location'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Version + Chevron */}
                                    <div className="flex items-center gap-3 pl-2 flex-shrink-0">
                                        <span className="font-mono text-xs text-slate-500 group-hover:text-slate-300 transition-colors">
                                            {node.version || 'v2.2.0'}
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-slate-500 transition-colors" />
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                            <Search className="w-8 h-8 mb-2 opacity-20" />
                            <p className="text-sm">No nodes found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
