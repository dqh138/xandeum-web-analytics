'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Activity, Cpu, Wifi, Clock, AlertTriangle } from 'lucide-react';
import { fetchNetworkHistory, fetchPNodes } from '@/lib/api';

export default function HealthDashboard() {
    const [nodes, setNodes] = useState<any[]>([]);
    const [snapshots, setSnapshots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [nodesData, snapshotsData] = await Promise.all([
                    fetchPNodes(),
                    fetchNetworkHistory(24),
                ]);
                setNodes(nodesData);
                setSnapshots(snapshotsData.reverse()); // Oldest first for chart
            } catch (err) {
                console.error('Failed to load health data', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, []);

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
                    <h2 className="mb-6 text-xl font-semibold text-white">Health Score Trend (Last 24 Hours)</h2>
                    <div className="h-64 flex items-end gap-2">
                        {snapshots.map((snapshot, index) => {
                            const score = snapshot.health?.score || 0;
                            const height = (score / 100) * 100;
                            return (
                                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                    <div
                                        className="w-full rounded-t bg-gradient-to-t from-emerald-500 to-blue-500 transition-all hover:opacity-80"
                                        style={{ height: `${height}%` }}
                                        title={`Score: ${score.toFixed(1)}`}
                                    />
                                    {index % 6 === 0 && (
                                        <span className="text-xs text-slate-500" suppressHydrationWarning>
                                            {new Date(snapshot.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </main>
    );
}
