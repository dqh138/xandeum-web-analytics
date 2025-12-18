'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Server, Activity, ShieldCheck, AlertCircle, Clock, Database, HardDrive, Wifi, TrendingUp, Info, Star } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchNodeDetails, fetchNodeHistory } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useStarredNodes } from '@/hooks/useStarredNodes';

export default function NodeDetailPage() {
  const { nodeId } = useParams();
  const router = useRouter();

  const [node, setNode] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toggleStar, isStarred } = useStarredNodes();

  useEffect(() => {
    if (!nodeId) return;

    const loadData = async () => {
      try {
        const [nodeData, historyData] = await Promise.all([
          fetchNodeDetails(nodeId as string),
          fetchNodeHistory(nodeId as string, 1440)
        ]);
        setNode(nodeData);
        setHistory(historyData);
      } catch (err: any) {
        console.error('Failed to load node details', err);
        setError('Failed to load node details. The node might not exist.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [nodeId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !node) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 p-4">
        <div className="mb-4 text-red-500">
          <AlertCircle size={48} />
        </div>
        <h2 className="mb-4 text-xl font-bold text-white">Error</h2>
        <p className="mb-6 text-slate-400">{error || 'Node not found'}</p>
        <Link
          href="/"
          className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-500"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const DetailItem = ({ icon: Icon, label, value, subValue }: any) => (
    <div className="flex items-start gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="rounded-lg bg-blue-500/10 p-3 text-blue-400">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-400">{label}</p>
        <p className="mt-1 font-mono text-slate-100">{value}</p>
        {subValue && <p className="text-xs text-slate-500">{subValue}</p>}
      </div>
    </div>
  );

  return (
    <main className="min-h-screen p-6 md:p-12">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div>
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>


          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
                <Server className="text-blue-500" />
                Node Details
              </h1>
              <p className="mt-2 font-mono text-slate-400">{node.node_id}</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleStar(node.node_id)}
                className="rounded-full border border-slate-700 bg-slate-800 p-2 text-slate-400 hover:border-yellow-500/50 hover:text-yellow-400 transition-all"
              >
                <Star
                  size={18}
                  className={cn(isStarred(node.node_id) ? "fill-yellow-400 text-yellow-400" : "")}
                />
              </button>

              <div className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border",
                node.status === 'online'
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-red-500/30 bg-red-500/10 text-red-400"
              )}>
                {node.status === 'online' ? <ShieldCheck size={16} /> : <AlertCircle size={16} />}
                {node.status.toUpperCase()}
              </div>
            </div>
          </div>
        </div>


        {/* Performance Score Section */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Current Score Card */}
          <div className="md:col-span-1 rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Activity size={100} className="text-blue-500" />
            </div>
            <h3 className="text-sm font-medium text-slate-400 mb-2">Performance Score</h3>
            <div className="flex items-end gap-2">
              <span className={cn(
                "text-5xl font-bold tracking-tight",
                (node.performance_score || 0) > 0.9 ? "text-emerald-400" : (node.performance_score || 0) >= 0.5 ? "text-yellow-400" : "text-red-400"
              )}>
                {(node.performance_score || 0).toFixed(2)}
              </span>
              <span className="text-sm text-slate-500 mb-2">/ 1.0</span>
            </div>
            {/* Progress Bar */}
            <div className="mt-4 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-1000",
                  (node.performance_score || 0) > 0.9 ? "bg-emerald-500" : (node.performance_score || 0) >= 0.5 ? "bg-yellow-500" : "bg-red-500"
                )}
                style={{ width: `${(node.performance_score || 0) * 100}%` }}
              />
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
              <Info size={14} />
              Based on Uptime (50%) and Latency (50%).
            </p>
          </div>

          {/* Historical Score Chart */}
          <div className="md:col-span-2 rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-400">Performance Trend (24h)</h3>
              <div className="flex items-center gap-1 text-xs text-emerald-400">
                <TrendingUp size={14} />
                <span>Live</span>
              </div>
            </div>
            <div className="h-[140px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[...history].reverse().map(record => {
                  // Calculate score for each point to show trend
                  // Benchmarks: Max Uptime = 24h window? No, assume cumulative. 
                  // To make it meaningful, we map raw metrics to score using approximate network standards
                  // Max Uptime Ref = 24h? Actually uptime_seconds is cumulative. 
                  // Detailed history has uptime_seconds.
                  // Let's use simplified local score calculation:
                  // Latency (if available, else 0 bad) -> 0.5
                  // Uptime (if > 1h excellent) -> 0.5 (Just checking if it IS uptime)

                  // Better approximation:
                  // Uptime Score: If system.uptime_seconds > 3600 (1h) -> 1.0
                  const uptimeScore = Math.min(1, (record.system?.uptime_seconds || 0) / 3600);

                  // Latency Score: Using reasonable absolute
                  const lat = record.performance?.latency_ms || 9999;
                  const latencyScore = Math.max(0, 1 - (lat / 500));

                  const total = (uptimeScore * 0.5) + (latencyScore * 0.5);
                  return {
                    ...record,
                    calculated_score: total
                  };
                })}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                    itemStyle={{ color: '#f59e0b' }}
                    labelFormatter={(label: string) => new Date(label).toLocaleTimeString()}
                    formatter={(value?: number) => [value ? value.toFixed(2) : '0.00', 'Score']}
                  />
                  <Area
                    type="monotone"
                    dataKey="calculated_score"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorScore)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <DetailItem
            icon={Wifi}
            label="Network Address"
            value={node.address}
            subValue={node.is_public ? 'Public Access Enabled' : 'Private Access'}
          />
          <DetailItem
            icon={Activity}
            label="RPC Port"
            value={node.rpc_port}
          />
          <DetailItem
            icon={Database}
            label="Software Version"
            value={node.version}
          />
          <DetailItem
            icon={HardDrive}
            label="Storage Used"
            value={`${(node.current_metrics.storage_used / 1024 / 1024 / 1024).toFixed(2)} GB`}
            subValue={`${node.current_metrics.storage_usage_percent.toFixed(4)}% of committed`}
          />
          <DetailItem
            icon={Clock}
            label="Uptime"
            value={`${(node.current_metrics.uptime_seconds / 3600).toFixed(1)} hrs`}
          />
          <DetailItem
            icon={Clock}
            label="Last Seen"
            value={new Date(node.last_seen_at).toLocaleString()}
          />
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Storage Chart */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 backdrop-blur-sm p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                <HardDrive size={20} />
              </div>
              <h2 className="text-lg font-bold text-white">Storage Usage (24h)</h2>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[...history].reverse()}>
                  <defs>
                    <linearGradient id="colorStorage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="timestamp"
                    stroke="#64748b"
                    fontSize={12}
                    tickFormatter={(str: string) => new Date(str).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  />
                  <YAxis stroke="#64748b" fontSize={12} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                    itemStyle={{ color: '#10b981' }}
                    labelFormatter={(label: string) => new Date(label).toLocaleString()}
                    formatter={(value: number | undefined) => [value ? `${value.toFixed(2)}%` : '0.00%', 'Usage']}
                  />
                  <Area
                    type="monotone"
                    dataKey="storage.usage_percent"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorStorage)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Uptime Chart */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 backdrop-blur-sm p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
                <Clock size={20} />
              </div>
              <h2 className="text-lg font-bold text-white">System Uptime (24h)</h2>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[...history].reverse()}>
                  <defs>
                    <linearGradient id="colorUptime" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="timestamp"
                    stroke="#64748b"
                    fontSize={12}
                    tickFormatter={(str: string) => new Date(str).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  />
                  <YAxis stroke="#64748b" fontSize={12} unit="h" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                    itemStyle={{ color: '#3b82f6' }}
                    labelFormatter={(label: string) => new Date(label).toLocaleString()}
                    formatter={(value: number | undefined) => [value ? `${(value / 3600).toFixed(2)}h` : '0.00h', 'Uptime']}
                  />
                  <Area
                    type="monotone"
                    dataKey="system.uptime_seconds"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorUptime)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
