'use client';

import { TrendingUp, Coins } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface EarningTrendChartProps {
    data: Array<{
        date: string;
        rewards: number;
    }>;
}

export function EarningTrendChart({ data }: EarningTrendChartProps) {
    // Calculate total and average
    const totalRewards = data.reduce((sum, item) => sum + item.rewards, 0);
    const avgRewards = data.length > 0 ? totalRewards / data.length : 0;

    // Calculate trend (compare last value to first)
    const trend = data.length >= 2
        ? ((data[data.length - 1].rewards - data[0].rewards) / data[0].rewards) * 100
        : 0;

    return (
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/20 p-8">
            {/* Background decoration */}
            <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-emerald-500/5 blur-3xl" />

            <div className="relative">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-emerald-500/10 p-3">
                            <Coins className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-200">Network Earnings</h3>
                            <p className="text-sm text-slate-500">30-day reward distribution</p>
                        </div>
                    </div>

                    <div className={`flex items-center gap-1 rounded-lg px-3 py-1.5 ${trend > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                        <TrendingUp size={16} className={trend < 0 ? 'rotate-180' : ''} />
                        <span className="text-sm font-semibold">{trend > 0 ? '+' : ''}{trend.toFixed(1)}%</span>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="mb-6 grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-sm text-slate-500">Total Distributed</div>
                        <div className="text-3xl font-bold text-white">
                            {totalRewards.toLocaleString()}
                            <span className="ml-2 text-lg text-slate-500">XAND</span>
                        </div>
                    </div>

                    <div>
                        <div className="text-sm text-slate-500">Daily Average</div>
                        <div className="text-3xl font-bold text-emerald-400">
                            {avgRewards.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            <span className="ml-2 text-lg text-slate-500">XAND</span>
                        </div>
                    </div>
                </div>

                {/* Chart */}
                <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorRewards" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="date"
                                stroke="#64748b"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#64748b"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '8px',
                                    padding: '8px 12px'
                                }}
                                labelStyle={{ color: '#cbd5e1' }}
                                itemStyle={{ color: '#10b981' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="rewards"
                                stroke="#10b981"
                                strokeWidth={2}
                                fill="url(#colorRewards)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
