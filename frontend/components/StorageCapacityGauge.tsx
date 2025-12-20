'use client';

import { HardDrive, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { formatBytes, formatPercentage, isValidMetric } from '@/lib/format';

interface StorageCapacityGaugeProps {
    totalStorage: number;
    usedStorage: number;
    capacityTrend?: number; // growth of total committed storage
    usageTrend?: number;    // growth of used storage (for prediction)
}

export function StorageCapacityGauge({ totalStorage, usedStorage, capacityTrend, usageTrend }: StorageCapacityGaugeProps) {
    const actualUsagePercent = totalStorage > 0 ? (usedStorage / totalStorage) * 100 : 0;
    const availableStorage = totalStorage - usedStorage;

    // Check if we have valid data
    const hasData = isValidMetric(totalStorage) && totalStorage > 0;

    // For very low usage, show minimum 5% on chart for visibility
    const displayUsagePercent = actualUsagePercent > 0 && actualUsagePercent < 5
        ? 5
        : actualUsagePercent;

    const isVeryLowUsage = actualUsagePercent > 0 && actualUsagePercent < 1;

    // Calculate days until full based on USAGE trend (not capacity trend)
    // Formula: Remaining / (Used * Rate)
    // If usageTrend <= 0, we can't predict full (infinite)
    let daysUntilFull: number | null = null;
    if (usageTrend && usageTrend > 0 && hasData && usedStorage > 0) {
        const dailyGrowth = usedStorage * (usageTrend / 100);
        if (dailyGrowth > 0) {
            daysUntilFull = Math.floor(availableStorage / dailyGrowth);
        }
    }

    const chartData = [
        {
            name: 'Storage',
            value: displayUsagePercent,
            fill: actualUsagePercent > 80 ? '#ef4444' : actualUsagePercent > 60 ? '#f59e0b' : '#10b981',
        }
    ];

    return (
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-8">
            {/* Background decoration */}
            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-blue-500/5 blur-3xl" />

            <div className="relative">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-blue-500/10 p-3">
                            <HardDrive className="h-6 w-6 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-200">Storage Capacity</h3>
                            <p className="text-sm text-slate-500">Online nodes only</p>
                        </div>
                    </div>

                    {capacityTrend !== undefined && hasData && (
                        <div className={`flex items-center gap-1 rounded-lg px-3 py-1.5 ${capacityTrend > 0 ? 'bg-emerald-500/10 text-emerald-400' :
                            capacityTrend < 0 ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-400'
                            }`}>
                            <TrendingUp size={16} className={capacityTrend < 0 ? 'rotate-180' : ''} />
                            <span className="text-sm font-semibold">{capacityTrend > 0 ? '+' : ''}{capacityTrend.toFixed(1)}%</span>
                        </div>
                    )}
                </div>

                {!hasData ? (
                    // Empty state when no storage data
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="mb-4 rounded-full bg-slate-800/50 p-4">
                            <HardDrive className="h-12 w-12 text-slate-600" />
                        </div>
                        <h4 className="mb-2 text-lg font-semibold text-slate-300">No Storage Data</h4>
                        <p className="max-w-sm text-sm text-slate-500">
                            Storage metrics will appear here once nodes begin reporting capacity data.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-8">
                        {/* Radial Chart */}
                        <div className="flex items-center justify-center">
                            <div className="relative h-48 w-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadialBarChart
                                        cx="50%"
                                        cy="50%"
                                        innerRadius="70%"
                                        outerRadius="100%"
                                        data={chartData}
                                        startAngle={90}
                                        endAngle={-270}
                                    >
                                        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                                        <RadialBar
                                            background
                                            dataKey="value"
                                            cornerRadius={10}
                                            fill={chartData[0].fill}
                                        />
                                    </RadialBarChart>
                                </ResponsiveContainer>

                                {/* Center text */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <div className="text-4xl font-bold text-white">
                                        {formatPercentage(actualUsagePercent, { decimals: actualUsagePercent < 0.01 ? 4 : 2 })}
                                    </div>
                                    <div className="text-xs text-slate-500">Used</div>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex flex-col justify-center space-y-4">
                            {isVeryLowUsage && (
                                <div className="mb-2 flex items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                                    <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" />
                                    <p className="text-xs text-blue-300">
                                        Usage is very low (&lt;1%). Chart shows minimum 5% for visibility.
                                    </p>
                                </div>
                            )}

                            <div>
                                <div className="text-sm text-slate-500">Total Capacity</div>
                                <div className="text-2xl font-bold text-slate-200">
                                    {formatBytes(totalStorage)}
                                </div>
                            </div>

                            <div>
                                <div className="text-sm text-slate-500">Used Storage</div>
                                <div className="text-2xl font-bold text-blue-400">
                                    {formatBytes(usedStorage)}
                                </div>
                            </div>

                            <div>
                                <div className="text-sm text-slate-500">Available</div>
                                <div className="text-2xl font-bold text-emerald-400">
                                    {formatBytes(availableStorage)}
                                </div>
                            </div>

                            {daysUntilFull && daysUntilFull > 0 && daysUntilFull < 36500 ? ( // Cap at 100 years
                                <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                                    <div className="text-xs text-amber-400">Estimated full in</div>
                                    <div className="text-lg font-bold text-amber-300">~{daysUntilFull} days</div>
                                </div>
                            ) : null}

                            {/* If growth is negative or zero, maybe show 'stable' or nothing */}
                            {(!daysUntilFull || daysUntilFull > 36500) && usageTrend !== undefined && hasData && (
                                <div className="mt-4 rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                                    <div className="text-xs text-slate-400">Storage Usage Status</div>
                                    <div className="text-sm font-semibold text-slate-300">
                                        {usageTrend > 0 ? 'Growing slowly' : usageTrend < 0 ? 'Usage decreasing' : 'Stable'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
