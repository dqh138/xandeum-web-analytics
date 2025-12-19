'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Activity, Cpu, Wifi, Clock, AlertTriangle } from 'lucide-react';
import { fetchNetworkHistory, fetchPNodes } from '@/lib/api';

export default function HealthDashboard() {
    const [nodes, setNodes] = useState<any[]>([]);
    const [snapshots, setSnapshots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<string>('1h');

    // Calculate limit based on time range (assuming 1 snapshot per minute)
    const getSnapshotLimit = (range: string) => {
        switch (range) {
            case '15min': return 15;
            case '30min': return 30;
            case '1h': return 60;
            case '2h': return 120;
            case '4h': return 240;
            case '12h': return 720;
            case '1d': return 1440;
            case '1w': return 10080;
            default: return 60;
        }
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const limit = getSnapshotLimit(timeRange);
                const [nodesData, snapshotsData] = await Promise.all([
                    fetchPNodes(),
                    fetchNetworkHistory(limit),
                ]);
                setNodes(nodesData);
                // Create a copy before reversing to avoid mutation
                const reversedSnapshots = [...snapshotsData].reverse();
                setSnapshots(reversedSnapshots); // Oldest first for chart
            } catch (err) {
                console.error('Failed to load health data', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, [timeRange]); // Re-fetch when timeRange changes


    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-900">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
        );
    }

    const latestSnapshot = snapshots[snapshots.length - 1];
    const healthScore = latestSnapshot?.health?.score || 0;

    // Performance metrics
    const nodesWithStats = nodes.filter(n => n.current_metrics?.cpu_percent !== undefined);
    const avgCpu = nodesWithStats.length > 0
        ? nodesWithStats.reduce((sum, n) => sum + (n.current_metrics?.cpu_percent || 0), 0) / nodesWithStats.length
        : 0;

    const avgRam = nodesWithStats.length > 0
        ? nodesWithStats.reduce((sum, n) => sum + (n.current_metrics?.ram_usage_percent || 0), 0) / nodesWithStats.length
        : 0;

    const avgUptime = nodes.length > 0
        ? nodes.reduce((sum, n) => sum + ((n.current_metrics?.uptime_seconds || 0) / 3600), 0) / nodes.length
        : 0;

    // Health status
    const getHealthStatus = (score: number) => {
        if (score >= 80) return { label: 'Excellent', color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
        if (score >= 60) return { label: 'Good', color: 'text-blue-400', bg: 'bg-blue-500/10' };
        if (score >= 40) return { label: 'Fair', color: 'text-orange-400', bg: 'bg-orange-500/10' };
        return { label: 'Poor', color: 'text-red-400', bg: 'bg-red-500/10' };
    };

    const healthStatus = getHealthStatus(healthScore);

    // Nodes by performance
    const highCpuNodes = nodes.filter(n => (n.current_metrics?.cpu_percent || 0) > 80);
    const highRamNodes = nodes.filter(n => (n.current_metrics?.ram_usage_percent || 0) > 80);

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
                        <Activity className="text-emerald-500" />
                        Network Health Monitor
                    </h1>
                    <p className="mt-2 text-slate-400">Real-time performance and reliability metrics</p>
                </div>

                {/* Health Score */}
                <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800/50 p-8 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-medium text-slate-400">Overall Network Health</h2>
                            <div className="mt-4 flex items-baseline gap-3">
                                <span className="text-6xl font-bold text-white">{healthScore.toFixed(1)}</span>
                                <span className="text-2xl text-slate-500">/100</span>
                            </div>
                            <div className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 ${healthStatus.bg}`}>
                                <span className={`text-sm font-medium ${healthStatus.color}`}>{healthStatus.label}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="space-y-2 text-sm text-slate-400">
                                <div>Availability: <span className="font-medium text-white">{latestSnapshot?.health?.availability_percent?.toFixed(1)}%</span></div>
                                <div>Reliability: <span className="font-medium text-white">{latestSnapshot?.health?.reliability_score?.toFixed(1)}/100</span></div>
                                <div>Performance: <span className="font-medium text-white">{latestSnapshot?.health?.performance_score?.toFixed(1)}/100</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-3 text-slate-400">
                            <Cpu className="h-5 w-5" />
                            <span className="text-sm font-medium">Avg CPU Usage</span>
                        </div>
                        <p className="mt-3 text-3xl font-bold text-white">{avgCpu.toFixed(1)}%</p>
                        <p className="mt-1 text-xs text-slate-500">{nodesWithStats.length} nodes reporting</p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-3 text-slate-400">
                            <Activity className="h-5 w-5" />
                            <span className="text-sm font-medium">Avg RAM Usage</span>
                        </div>
                        <p className="mt-3 text-3xl font-bold text-white">{avgRam.toFixed(1)}%</p>
                        <p className="mt-1 text-xs text-slate-500">{nodesWithStats.length} nodes reporting</p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-3 text-slate-400">
                            <Clock className="h-5 w-5" />
                            <span className="text-sm font-medium">Avg Uptime</span>
                        </div>
                        <p className="mt-3 text-3xl font-bold text-white">{avgUptime.toFixed(1)}h</p>
                        <p className="mt-1 text-xs text-slate-500">Across all nodes</p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-3 text-slate-400">
                            <Wifi className="h-5 w-5" />
                            <span className="text-sm font-medium">Online Nodes</span>
                        </div>
                        <p className="mt-3 text-3xl font-bold text-white">
                            {nodes.filter(n => n.status === 'online').length}/{nodes.length}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            {((nodes.filter(n => n.status === 'online').length / nodes.length) * 100).toFixed(1)}% availability
                        </p>
                    </div>
                </div>

                {/* Alerts */}
                {(highCpuNodes.length > 0 || highRamNodes.length > 0) && (
                    <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-6 backdrop-blur-sm">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-orange-400" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-orange-400">Performance Warnings</h3>
                                <div className="mt-3 space-y-2 text-sm text-slate-300">
                                    {highCpuNodes.length > 0 && (
                                        <p>• {highCpuNodes.length} node(s) with high CPU usage (&gt;80%)</p>
                                    )}
                                    {highRamNodes.length > 0 && (
                                        <p>• {highRamNodes.length} node(s) with high RAM usage (&gt;80%)</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Health Trend */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-white">
                            Health Score Trend
                            <span className="ml-3 text-sm font-normal text-slate-500">
                                {snapshots.length} data points
                            </span>
                        </h2>

                        {/* Time Range Selector */}
                        <div className="flex gap-2">
                            {[
                                { value: '15min', label: '15m' },
                                { value: '30min', label: '30m' },
                                { value: '1h', label: '1h' },
                                { value: '2h', label: '2h' },
                                { value: '4h', label: '4h' },
                                { value: '12h', label: '12h' },
                                { value: '1d', label: '1d' },
                                { value: '1w', label: '1w' },
                            ].map(({ value, label }) => (
                                <button
                                    key={value}
                                    onClick={() => setTimeRange(value)}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${timeRange === value
                                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {snapshots.length === 0 ? (
                        <div className="flex h-64 items-center justify-center text-slate-500">
                            <p>No historical data available yet. Data will appear after the first sync.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Area Chart with Y-axis */}
                            <div className="flex gap-4">
                                {/* Y-axis labels */}
                                <div className="flex flex-col justify-between text-xs text-slate-500 pt-2 pb-2">
                                    <span>100</span>
                                    <span>80</span>
                                    <span>60</span>
                                    <span>40</span>
                                    <span>20</span>
                                    <span>0</span>
                                </div>

                                {/* Chart area */}
                                <div className="flex-1">
                                    <div className="relative h-64 rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                                        <svg className="h-full w-full" viewBox="0 0 1000 240" preserveAspectRatio="none">
                                            <defs>
                                                {/* Gradient for area fill */}
                                                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                    <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.4" />
                                                    <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.1" />
                                                </linearGradient>
                                            </defs>

                                            {/* Grid lines */}
                                            {[0, 20, 40, 60, 80, 100].map(value => {
                                                const y = 240 - (value / 100) * 240;
                                                return (
                                                    <line
                                                        key={value}
                                                        x1="0"
                                                        y1={y}
                                                        x2="1000"
                                                        y2={y}
                                                        stroke="rgb(51, 65, 85)"
                                                        strokeWidth="1"
                                                        strokeDasharray="4 4"
                                                        opacity="0.3"
                                                    />
                                                );
                                            })}

                                            {/* Area path */}
                                            <path
                                                d={(() => {
                                                    const points = snapshots.map((snapshot, index) => {
                                                        const x = (index / (snapshots.length - 1)) * 1000;
                                                        const score = snapshot.health?.score || 0;
                                                        const y = 240 - (score / 100) * 240;
                                                        return `${x},${y}`;
                                                    });

                                                    const pathData = `M 0,240 L ${points.join(' L ')} L 1000,240 Z`;
                                                    return pathData;
                                                })()}
                                                fill="url(#areaGradient)"
                                            />

                                            {/* Line path */}
                                            <path
                                                d={(() => {
                                                    const points = snapshots.map((snapshot, index) => {
                                                        const x = (index / (snapshots.length - 1)) * 1000;
                                                        const score = snapshot.health?.score || 0;
                                                        const y = 240 - (score / 100) * 240;
                                                        return `${x},${y}`;
                                                    });

                                                    return `M ${points.join(' L ')}`;
                                                })()}
                                                fill="none"
                                                stroke="rgb(16, 185, 129)"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />

                                            {/* Data points */}
                                            {snapshots.map((snapshot, index) => {
                                                const x = (index / (snapshots.length - 1)) * 1000;
                                                const score = snapshot.health?.score || 0;
                                                const y = 240 - (score / 100) * 240;

                                                return (
                                                    <g key={index}>
                                                        <circle
                                                            cx={x}
                                                            cy={y}
                                                            r="4"
                                                            fill="rgb(16, 185, 129)"
                                                            className="hover:r-6 transition-all cursor-pointer"
                                                        />
                                                        <title suppressHydrationWarning>
                                                            Score: {score.toFixed(2)} at {new Date(snapshot.timestamp).toLocaleTimeString()}
                                                        </title>
                                                    </g>
                                                );
                                            })}
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* X-axis labels */}
                            <div className="ml-8 flex justify-between text-xs text-slate-500">
                                {[0, Math.floor(snapshots.length * 0.25), Math.floor(snapshots.length * 0.5), Math.floor(snapshots.length * 0.75), snapshots.length - 1].map(i => (
                                    <span key={i} suppressHydrationWarning>
                                        {snapshots[i] ? new Date(snapshots[i].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </span>
                                ))}
                            </div>

                            {/* Stats summary */}
                            <div className="grid grid-cols-4 gap-4 rounded-lg border border-slate-800 bg-slate-800/30 p-4">
                                <div>
                                    <div className="text-xs text-slate-500">Current</div>
                                    <div className="text-lg font-semibold text-white">
                                        {snapshots[snapshots.length - 1]?.health?.score?.toFixed(1) || 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500">Average</div>
                                    <div className="text-lg font-semibold text-white">
                                        {(snapshots.reduce((sum, s) => sum + (s.health?.score || 0), 0) / snapshots.length).toFixed(1)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500">Highest</div>
                                    <div className="text-lg font-semibold text-emerald-400">
                                        {Math.max(...snapshots.map(s => s.health?.score || 0)).toFixed(1)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500">Lowest</div>
                                    <div className="text-lg font-semibold text-orange-400">
                                        {Math.min(...snapshots.map(s => s.health?.score || 0)).toFixed(1)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
