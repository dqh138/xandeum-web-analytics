'use client';

import { TrendingUp, Database, HardDrive } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatBytes } from '@/lib/format';

interface NetworkHistoryItem {
    timestamp: string;
    storage: {
        total_committed: number;
        total_used: number;
    };
}

interface StorageTrendsChartProps {
    history: NetworkHistoryItem[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-3 shadow-xl backdrop-blur-md">
                <p className="mb-2 text-xs font-medium text-slate-400">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                        <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-slate-300">
                            {entry.name}:
                        </span>
                        <span className="font-mono font-bold text-white">
                            {formatBytes(entry.value)}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export function StorageTrendsChart({ history }: StorageTrendsChartProps) {
    if (!history || history.length === 0) {
        return (
            <div className="flex h-[300px] items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/50 p-8">
                <p className="text-slate-400">No history data available yet</p>
            </div>
        );
    }

    // Sort history by date ascending
    const data = [...history]
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map(item => {
            const committed = item.storage?.total_committed || 0;
            const used = item.storage?.total_used || 0;
            return {
                date: new Date(item.timestamp).toLocaleTimeString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                committed,
                used,
                timestamp: new Date(item.timestamp).getTime()
            };
        });

    return (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-white">Storage Trends</h2>
                    <p className="text-sm text-slate-400">Committed Capacity vs Used Storage over time</p>
                </div>
            </div>

            <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorCommitted" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorUsed" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="date"
                            stroke="#64748b"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={30}
                        />
                        {/* Y-Axis for Committed (Left) */}
                        <YAxis
                            yAxisId="left"
                            domain={['dataMin', 'dataMax']}
                            stroke="#a855f7"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => formatBytes(value, { decimals: 4 }).split(' ')[0]}
                        />
                        {/* Y-Axis for Used (Right) */}
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            domain={[0, 'auto']}
                            stroke="#3b82f6"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => formatBytes(value, { decimals: 4 }).split(' ')[0]}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" />

                        <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="committed"
                            stroke="#a855f7"
                            strokeWidth={2}
                            fill="url(#colorCommitted)"
                            name="Committed"
                            isAnimationActive={false}
                        />
                        <Area
                            yAxisId="right"
                            type="monotone"
                            dataKey="used"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fill="url(#colorUsed)"
                            name="Used"
                            isAnimationActive={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
