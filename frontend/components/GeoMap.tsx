'use client';

import { useMemo, useState } from 'react';
// @ts-ignore
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Maximize, Map as MapIcon, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Node {
    node_id: string;
    status: string;
    geo?: {
        latitude?: number;
        longitude?: number;
        city?: string;
        country?: string;
    };
    storage_capacity?: number; // Assumed available or 0
}

interface GeoMapProps {
    nodes: Node[];
}

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export function GeoMap({ nodes }: GeoMapProps) {
    const [position, setPosition] = useState({ coordinates: [0, 20], zoom: 1 });
    const [tooltipContent, setTooltipContent] = useState<{ x: number, y: number, data: any } | null>(null);

    // Group nodes by location
    const groupedNodes = useMemo(() => {
        const groups: Record<string, { lat: number; lng: number; count: number; active: number; id: string; country: string; city: string }> = {};

        nodes.forEach(node => {
            if (!node.geo?.latitude || !node.geo?.longitude) return;

            // Group close coordinates significantly to avoid clutter
            const latKey = Math.round(node.geo.latitude * 2) / 2;
            const lngKey = Math.round(node.geo.longitude * 2) / 2;
            const key = node.geo.city ? `${node.geo.city}-${node.geo.country}` : `${latKey},${lngKey}`;

            if (!groups[key]) {
                groups[key] = {
                    lat: node.geo.latitude,
                    lng: node.geo.longitude,
                    count: 0,
                    active: 0,
                    id: key,
                    country: node.geo.country || 'Unknown',
                    city: node.geo.city || 'Unknown Location'
                };
            }
            groups[key].count++;
            if (node.status === 'online') groups[key].active++;
        });

        return Object.values(groups).sort((a, b) => b.count - a.count);
    }, [nodes]);

    // Calculate Top Regions for Overlay (Active Nodes Only)
    const topRegions = useMemo(() => {
        const countryCounts: Record<string, number> = {};
        nodes.forEach(n => {
            if (n.status !== 'online') return; // Only count Active Nodes
            const c = n.geo?.country || 'Unknown';
            countryCounts[c] = (countryCounts[c] || 0) + 1;
        });
        return Object.entries(countryCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([country, count]) => ({ country, count }));
    }, [nodes]);

    const maxCount = Math.max(...groupedNodes.map(g => g.count), 1);
    const sizeScale = scaleLinear().domain([1, maxCount]).range([4, 12]);

    const handleZoomIn = () => {
        if (position.zoom >= 4) return;
        setPosition(pos => ({ ...pos, zoom: pos.zoom * 1.5 }));
    };

    const handleZoomOut = () => {
        if (position.zoom <= 1) return;
        setPosition(pos => ({ ...pos, zoom: pos.zoom / 1.5 }));
    };

    const handleReset = () => {
        setPosition({ coordinates: [0, 20], zoom: 1 });
    };

    return (
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl h-full">
            {/* Header / Insight Overlay Left */}
            <div className="absolute left-6 top-6 z-10 pointer-events-none">
                <div className="flex items-center gap-2 mb-4 pointer-events-auto">
                    <div className="bg-blue-500/20 p-2 rounded-lg backdrop-blur-md border border-blue-500/30">
                        <Globe className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-wide">Global Intelligence</h3>
                        <p className="text-xs text-blue-300/80 font-mono">LIVE NETWORK TOPOLOGY</p>
                    </div>
                </div>

                {/* Top Regions List */}
                <div className="space-y-2 pointer-events-auto">
                    {topRegions.map((region, idx) => (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            key={region.country}
                            className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-sm border border-slate-800 p-2 rounded-lg text-xs hover:border-blue-500/50 transition-colors w-48"
                        >
                            <span className="font-mono text-slate-400 w-4">#{idx + 1}</span>
                            <span className="flex-1 text-white truncate font-medium">{region.country}</span>
                            <span className="font-bold text-emerald-400">{region.count}</span>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Controls Overlay Right */}
            <div className="absolute right-6 bottom-16 z-10 flex flex-col gap-2">
                <button
                    onClick={handleZoomIn}
                    className="p-2 bg-slate-900/90 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
                    aria-label="Zoom In"
                >
                    <Plus size={18} />
                </button>
                <button
                    onClick={handleZoomOut}
                    className="p-2 bg-slate-900/90 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
                    aria-label="Zoom Out"
                >
                    <Minus size={18} />
                </button>
                <button
                    onClick={handleReset}
                    className="p-2 bg-slate-900/90 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
                    aria-label="Reset View"
                >
                    <Maximize size={18} />
                </button>
            </div>

            {/* Map Container */}
            <div className="h-full w-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0B1121] to-[#020617]">
                <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{ scale: 150 }}
                    style={{ width: "100%", height: "100%" }}
                >
                    <ZoomableGroup
                        zoom={position.zoom}
                        center={position.coordinates as [number, number]}
                        onMoveEnd={(pos: { coordinates: [number, number], zoom: number }) => setPosition(pos)}
                    >
                        <Geographies geography={geoUrl}>
                            {({ geographies }: { geographies: any[] }) =>
                                geographies.map((geo: any) => (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        fill="#1e293b"
                                        stroke="#334155"
                                        strokeWidth={0.5}
                                        style={{
                                            default: { fill: "#1e293b", outline: "none" },
                                            hover: { fill: "#334155", stroke: "#60a5fa", strokeWidth: 1, outline: "none" },
                                            pressed: { fill: "#0f172a", outline: "none" },
                                        }}
                                    />
                                ))
                            }
                        </Geographies>

                        {/* Connection Lines (Cosmetic) */}
                        {/* Could be added here for decorative network effects */}

                        {/* Markers */}
                        {groupedNodes.map((group) => {
                            const size = sizeScale(group.count);
                            const isLarge = group.count > 5;
                            const mainColor = group.active > 0 ? "#10b981" : "#ef4444"; // Emerald or Red

                            return (
                                <Marker
                                    key={group.id}
                                    coordinates={[group.lng, group.lat]}
                                    onMouseEnter={(e: any) => {
                                        // Tooltip logic
                                        // Simple approximation or parent relative
                                    }}
                                >
                                    <g className="group cursor-pointer">
                                        {/* Ripple / Pulse Effect */}
                                        <circle
                                            r={size * 2}
                                            fill={mainColor}
                                            opacity={0.2}
                                            className="animate-ping"
                                            style={{ animationDuration: `${2 + Math.random()}s` }}
                                        />

                                        {/* Outer Glow */}
                                        <circle
                                            r={size * 1.5}
                                            fill={mainColor}
                                            opacity={0.15}
                                            className="group-hover:opacity-30 transition-opacity"
                                        />

                                        {/* Core */}
                                        <circle
                                            r={size}
                                            fill={mainColor}
                                            stroke="#0f172a"
                                            strokeWidth={1}
                                            className="transition-all duration-300 group-hover:scale-125"
                                        />

                                        {/* Tooltip on Hover */}
                                        <title>{`${group.city}, ${group.country}\nNodes: ${group.count}\nActive: ${group.active}`}</title>
                                    </g>
                                </Marker>
                            );
                        })}
                    </ZoomableGroup>
                </ComposableMap>
            </div>

            {/* Legend / Status Bar */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 py-3 flex items-center justify-between text-xs text-slate-400">
                <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                        <span className="text-slate-300">Live Nodes</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        <span className="text-slate-300">Offline</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 font-mono">
                    <MapIcon size={14} className="text-slate-500" />
                    <span>PROJ: MERCATOR</span>
                    <span className="text-slate-600">|</span>
                    <span>SCALE: 1:150M</span>
                </div>
            </div>
        </div>
    );
}
