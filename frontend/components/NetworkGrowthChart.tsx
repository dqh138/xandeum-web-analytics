'use client';

import { TrendingUp, Database } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatBytes } from '@/lib/format';

interface NetworkHistoryItem {
    timestamp: string;
    storage: {
        total_committed: number;
        total_used: number;
    };
}

interface NetworkGrowthChartProps {
    history: NetworkHistoryItem[];
}

export function NetworkGrowthChart({ history }: NetworkGrowthChartProps) {
    if (!history || history.length === 0) {
        return (
            <div className="flex h-full items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/50 p-8">
                <p className="text-slate-400">No history data available yet</p>
            </div>
        );
    }

    // Sort history by date ascending for the chart
    const data = [...history]
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map(item => {
            const val = item.storage?.total_committed || 0;
            return {
                date: new Date(item.timestamp).toLocaleTimeString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                value: val,
                displayValue: formatBytes(val),
                timestamp: new Date(item.timestamp).getTime()
            };
        });

    // Calculate trend
    const firstValue = data[0]?.value || 0;
    const lastValue = data[data.length - 1]?.value || 0;
    const trend = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

    return (
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950/20 p-8">
            {/* Background decoration */}
            <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-purple-500/5 blur-3xl" />

            <div className="relative">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-purple-500/10 p-3">
                            <Database className="h-6 w-6 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-200">Network Growth</h3>
                            <p className="text-sm text-slate-500">Total Committed Storage History</p>
                        </div>
                    </div>

                    <div className={`flex items-center gap-1 rounded-lg px-3 py-1.5 ${trend > 0 ? 'bg-emerald-500/10 text-emerald-400' :
                        trend < 0 ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                        <TrendingUp size={16} className={trend < 0 ? 'rotate-180' : ''} />
                        <span className="text-sm font-semibold">{trend > 0 ? '+' : ''}{trend.toFixed(1)}%</span>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="mb-6 grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-sm text-slate-500">Current Capacity</div>
                        <div className="text-3xl font-bold text-white">
                            {formatBytes(lastValue)}
                        </div>
                    </div>

                    <div>
                        <div className="text-sm text-slate-500">Growth (Period)</div>
                        <div className={`text-3xl font-bold ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {trend > 0 ? '+' : ''}{formatBytes(lastValue - firstValue)}
                        </div>
                    </div>
                </div>

                {/* Chart */}
                <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
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
                            <YAxis
                                domain={['dataMin', 'dataMax']} // Auto-zoom
                                stroke="#64748b"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => formatBytes(value, { decimals: 1 }).split(' ')[0]}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '8px',
                                    padding: '8px 12px'
                                }}
                                labelStyle={{ color: '#cbd5e1' }}
                                itemStyle={{ color: '#a855f7' }}
                                formatter={(value: number) => [formatBytes(value), 'Committed Storage']}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#a855f7"
                                strokeWidth={2}
                                fill="url(#colorValue)"
                                isAnimationActive={false} // Disable animation to prevent "jumping" on redraw
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
