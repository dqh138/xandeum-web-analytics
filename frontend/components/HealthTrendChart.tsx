'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';

interface HealthSnapshot {
    timestamp: string;
    health: {
        score: number;
    };
}

interface HealthTrendChartProps {
    data: HealthSnapshot[];
    height?: number;
}

export function HealthTrendChart({ data, height = 300 }: HealthTrendChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className={`flex h-[${height}px] items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/50 p-8`}>
                <p className="text-slate-400">No health history available</p>
            </div>
        );
    }

    const chartData = data.map(item => ({
        timestamp: new Date(item.timestamp).getTime(),
        date: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fullDate: new Date(item.timestamp).toLocaleString(),
        score: item.health?.score || 0
    }));

    // Define zones
    const zones = [
        { y1: 0, y2: 40, fill: '#ef4444', label: 'Critical' }, // Red
        { y1: 40, y2: 60, fill: '#f97316', label: 'Fair' },    // Orange
        { y1: 60, y2: 80, fill: '#3b82f6', label: 'Good' },    // Blue
        { y1: 80, y2: 100, fill: '#10b981', label: 'Excellent' } // Green
    ];

    return (
        <div className="h-full w-full">
            <ResponsiveContainer width="100%" height={height}>
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                        </linearGradient>
                    </defs>

                    {/* Background Zones */}
                    <ReferenceArea y1={0} y2={40} fill="#ef4444" fillOpacity="0.05" />
                    <ReferenceArea y1={40} y2={60} fill="#f97316" fillOpacity="0.05" />
                    <ReferenceArea y1={60} y2={80} fill="#3b82f6" fillOpacity="0.05" />
                    <ReferenceArea y1={80} y2={100} fill="#10b981" fillOpacity="0.05" />

                    <XAxis
                        dataKey="date"
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={30}
                    />
                    <YAxis
                        domain={[0, 100]}
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
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
                        labelFormatter={(label, payload) => payload[0]?.payload.fullDate || label}
                        formatter={(value: number) => [value.toFixed(1), 'Health Score']}
                    />
                    <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#scoreGradient)"
                        animationDuration={1000}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
