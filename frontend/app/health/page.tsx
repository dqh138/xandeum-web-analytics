'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Activity, Cpu, Wifi, Clock, AlertTriangle } from 'lucide-react';
import { fetchNetworkHistory, fetchPNodes } from '@/lib/api';
import { MetricCard } from '@/components/ui/MetricCard';
import { MetricCardSkeleton } from '@/components/ui/Skeleton';
import { HealthTrendChart } from '@/components/HealthTrendChart';
import { formatDuration } from '@/lib/format';

export default function HealthDashboard() {
    const [nodes, setNodes] = useState<any[]>([]);
    const [snapshots, setSnapshots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<string>('1h');

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
                setNodes(nodesData || []);
                // Sort by time: oldest first for chart
                const sortedSnapshots = [...(snapshotsData || [])].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                setSnapshots(sortedSnapshots);
            } catch (err) {
                console.error('Failed to load health data', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, [timeRange]);

    // Latest snapshot
    const latestSnapshot = snapshots[snapshots.length - 1];
    const healthScore = latestSnapshot?.health?.score || 0;

    // Determine Health status & Color
    const getHealthStatus = (score: number) => {
        if (score >= 80) return { label: 'Excellent', color: 'green', text: 'text-emerald-400', bannerBg: 'bg-emerald-500/10' };
        if (score >= 60) return { label: 'Good', color: 'blue', text: 'text-blue-400', bannerBg: 'bg-blue-500/10' };
        if (score >= 40) return { label: 'Fair', color: 'orange', text: 'text-orange-400', bannerBg: 'bg-orange-500/10' };
        return { label: 'Critical', color: 'red', text: 'text-red-400', bannerBg: 'bg-red-500/10' };
    };
    const healthInfo = getHealthStatus(healthScore);

    // Calculate detailed metrics from CURRENT nodes state
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
    const onlineNodes = nodes.filter(n => n.status === 'online').length;
    const availability = nodes.length > 0 ? (onlineNodes / nodes.length) * 100 : 0;

    // Warnings
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

                {/* Main Health Card */}
                {loading ? (
                    <div className="h-48 animate-pulse rounded-xl bg-slate-800" />
                ) : (
                    <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800/50 p-8 backdrop-blur-sm">
                        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h2 className="text-lg font-medium text-slate-400">Overall Network Health</h2>
                                <div className="mt-4 flex items-baseline gap-3">
                                    <span className="text-6xl font-bold text-white">{healthScore.toFixed(1)}</span>
                                    <span className="text-2xl text-slate-500">/100</span>
                                </div>
                                <div className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 ${healthInfo.bannerBg}`}>
                                    <span className={`text-sm font-medium ${healthInfo.text}`}>{healthInfo.label}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 text-right md:grid-cols-1">
                                <div>
                                    <p className="text-sm text-slate-500">Availability Score</p>
                                    <p className="text-xl font-medium text-white">{latestSnapshot?.health?.availability_percent?.toFixed(1)}%</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Reliability Score</p>
                                    <p className="text-xl font-medium text-white">{latestSnapshot?.health?.reliability_score?.toFixed(1)}/100</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Performance Score</p>
                                    <p className="text-xl font-medium text-white">{latestSnapshot?.health?.performance_score?.toFixed(1)}/100</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Metrics Grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {loading ? (
                        <>
                            <MetricCardSkeleton />
                            <MetricCardSkeleton />
                            <MetricCardSkeleton />
                            <MetricCardSkeleton />
                        </>
                    ) : (
                        <>
                            <MetricCard
                                label="Avg CPU Usage"
                                value={`${avgCpu.toFixed(1)}%`}
                                icon={Cpu}
                                color="blue"
                                trend={{ value: 0, label: 'Stable' }}
                            />
                            <MetricCard
                                label="Avg RAM Usage"
                                value={`${avgRam.toFixed(1)}%`}
                                icon={Activity}
                                color="purple"
                                trend={{ value: 0, label: 'Stable' }}
                            />
                            <MetricCard
                                label="Avg Uptime"
                                value={`${avgUptime.toFixed(1)}h`}
                                icon={Clock}
                                color="green"
                            />
                            <MetricCard
                                label="Online Nodes"
                                value={`${onlineNodes}/${nodes.length}`}
                                icon={Wifi}
                                color="emerald"
                                trend={{ value: 0, label: `${availability.toFixed(1)}% availability` }}
                            />
                        </>
                    )}
                </div>

                {/* Alerts */}
                {(!loading && (highCpuNodes.length > 0 || highRamNodes.length > 0)) && (
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

                {/* Health Chart */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-semibold text-white">Health Score History</h2>
                            {/* Stats Summary Inline */}
                            {!loading && snapshots.length > 0 && (
                                <div className="hidden gap-3 text-xs text-slate-400 md:flex">
                                    <span>Avg: <span className="text-white">{(snapshots.reduce((s, x) => s + (x.health?.score || 0), 0) / snapshots.length).toFixed(1)}</span></span>
                                    <span>Max: <span className="text-emerald-400">{Math.max(...snapshots.map(s => s.health?.score || 0)).toFixed(1)}</span></span>
                                    <span>Min: <span className="text-orange-400">{Math.min(...snapshots.map(s => s.health?.score || 0)).toFixed(1)}</span></span>
                                </div>
                            )}
                        </div>

                        {/* Time Range Selector */}
                        <div className="flex flex-wrap gap-2">
                            {[
                                { value: '15min', label: '15m' },
                                { value: '30min', label: '30m' },
                                { value: '1h', label: '1h' },
                                { value: '2h', label: '2h' },
                                { value: '4h', label: '4h' },
                                { value: '12h', label: '12h' },
                                { value: '1d', label: '1d' }
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

                    <div className="h-[350px] w-full">
                        {loading ? (
                            <div className="flex h-full items-center justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-t-blue-500" />
                            </div>
                        ) : (
                            <HealthTrendChart data={snapshots} height={350} />
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
