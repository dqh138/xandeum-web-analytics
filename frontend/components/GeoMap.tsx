'use client';

import { useMemo } from 'react';
// @ts-ignore
import { ComposableMap, Geographies, Geography, Marker, Line } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';

interface Node {
    node_id: string;
    status: string;
    geo?: {
        latitude?: number;
        longitude?: number;
        city?: string;
        country?: string;
    };
}

interface GeoMapProps {
    nodes: Node[];
}

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export function GeoMap({ nodes }: GeoMapProps) {
    const groupedNodes = useMemo(() => {
        const groups: Record<string, { lat: number; lng: number; count: number; active: number; id: string }> = {};

        nodes.forEach(node => {
            // Default to 0,0 if missing (should filter out before but just safely handle)
            if (!node.geo?.latitude || !node.geo?.longitude) return;

            // Key by city if available, otherwise round coordinates to group nearby
            const key = node.geo.city || `${node.geo.latitude.toFixed(1)},${node.geo.longitude.toFixed(1)}`;

            if (!groups[key]) {
                groups[key] = {
                    lat: node.geo.latitude,
                    lng: node.geo.longitude,
                    count: 0,
                    active: 0,
                    id: key
                };
            }
            groups[key].count++;
            if (node.status === 'online') groups[key].active++;
        });

        return Object.values(groups).sort((a, b) => b.count - a.count);
    }, [nodes]);

    const maxCount = Math.max(...groupedNodes.map(g => g.count), 1);
    const sizeScale = scaleLinear().domain([1, maxCount]).range([4, 12]); // Bubble size

    // Create connections between the top hubs for visualization
    const connections = useMemo(() => {
        if (groupedNodes.length < 2) return [];
        const topHubs = groupedNodes.slice(0, Math.min(6, groupedNodes.length));
        const lines = [];
        for (let i = 0; i < topHubs.length; i++) {
            // Connect to the next 2 logical hubs to form a mesh
            for (let j = i + 1; j < Math.min(i + 3, topHubs.length); j++) {
                lines.push({
                    from: [topHubs[i].lng, topHubs[i].lat],
                    to: [topHubs[j].lng, topHubs[j].lat]
                });
            }
        }
        return lines;
    }, [groupedNodes]);

    const totalCountries = new Set(nodes.map(n => n.geo?.country).filter(Boolean)).size;
    const totalActive = nodes.filter(n => n.status === 'online').length;
    // If no geo nodes, just show totalNodes
    const displayedNodesCount = nodes.filter(n => n.geo?.latitude).length;

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
            <div className="mb-8 flex items-start justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-white">Global Node Distribution</h3>
                    <p className="mt-1 text-sm text-slate-400">
                        {displayedNodesCount} nodes in {totalCountries} countries
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-sm font-medium text-slate-300">{totalActive} active</span>
                </div>
            </div>

            <div className="relative h-[400px] w-full overflow-hidden rounded-lg bg-[#0B1121]">
                <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{
                        scale: 110,
                        center: [0, 20]
                    }}
                    style={{ width: "100%", height: "100%" }}
                >
                    <Geographies geography={geoUrl}>
                        {({ geographies }: { geographies: any[] }) =>
                            geographies.map((geo) => (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    fill="#1e293b"
                                    stroke="#0f172a"
                                    strokeWidth={0.5}
                                    style={{
                                        default: { outline: "none" },
                                        hover: { fill: "#334155", outline: "none" },
                                        pressed: { outline: "none" },
                                    }}
                                />
                            ))
                        }
                    </Geographies>

                    {/* Arcs/Lines */}
                    {connections.map((conn, i) => (
                        <Line
                            key={`conn-${i}`}
                            from={conn.from}
                            to={conn.to}
                            stroke="#10b981"
                            strokeWidth={1}
                            strokeOpacity={0.2}
                            strokeDasharray="4 4"
                        />
                    ))}

                    {/* Node Bubbles */}
                    {groupedNodes.map((group) => (
                        <Marker key={group.id} coordinates={[group.lng, group.lat]}>
                            <circle
                                r={sizeScale(group.count)}
                                fill="#64748b"
                                stroke="#fff"
                                strokeWidth={1}
                                className="origin-center transition-all duration-300 hover:fill-emerald-500 hover:scale-110"
                            />
                            {/* Inner text for count if > 1 */}
                            {group.count > 1 && (
                                <text
                                    textAnchor="middle"
                                    y={sizeScale(group.count) > 8 ? 4 : 3}
                                    style={{
                                        fontFamily: "system-ui",
                                        fontSize: sizeScale(group.count) > 8 ? "10px" : "8px",
                                        fill: "white",
                                        pointerEvents: "none",
                                        fontWeight: "bold"
                                    }}
                                >
                                    {group.count}
                                </text>
                            )}
                            {/* Small green dot if single node */}
                            {group.count === 1 && (
                                <circle r={3} fill="#10b981" stroke="none" />
                            )}
                        </Marker>
                    ))}
                </ComposableMap>
            </div>

            <div className="mt-4 flex justify-between">
                <div className="px-3 py-1 rounded-md border border-slate-800 text-xs text-slate-400 bg-slate-800/50">
                    — Connections
                </div>
                <div className="px-3 py-1 rounded-md border border-emerald-900/30 text-xs text-emerald-400 bg-emerald-950/30">
                    ● Active nodes
                </div>
            </div>
        </div>
    );
}
