'use client';

import { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        label?: string;
    };
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'emerald';
    isLoading?: boolean;
    isEmpty?: boolean;
    emptyMessage?: string;
}

const colorClasses = {
    blue: {
        icon: 'text-blue-400 bg-blue-500/10',
        value: 'text-blue-400',
        trend: 'text-blue-400 bg-blue-500/10',
    },
    green: {
        icon: 'text-green-400 bg-green-500/10',
        value: 'text-green-400',
        trend: 'text-green-400 bg-green-500/10',
    },
    purple: {
        icon: 'text-purple-400 bg-purple-500/10',
        value: 'text-purple-400',
        trend: 'text-purple-400 bg-purple-500/10',
    },
    orange: {
        icon: 'text-orange-400 bg-orange-500/10',
        value: 'text-orange-400',
        trend: 'text-orange-400 bg-orange-500/10',
    },
    red: {
        icon: 'text-red-400 bg-red-500/10',
        value: 'text-red-400',
        trend: 'text-red-400 bg-red-500/10',
    },
    emerald: {
        icon: 'text-emerald-400 bg-emerald-500/10',
        value: 'text-emerald-400',
        trend: 'text-emerald-400 bg-emerald-500/10',
    },
};

export function MetricCard({
    label,
    value,
    icon: Icon,
    trend,
    color = 'blue',
    isLoading = false,
    isEmpty = false,
    emptyMessage = 'No data available',
}: MetricCardProps) {
    const colors = colorClasses[color];

    if (isLoading) {
        return (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                <div className="animate-pulse space-y-3">
                    <div className="h-5 w-24 rounded bg-slate-800" />
                    <div className="h-8 w-32 rounded bg-slate-800" />
                </div>
            </div>
        );
    }

    if (isEmpty) {
        return (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 text-slate-500">
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{label}</span>
                </div>
                <p className="mt-3 text-sm italic text-slate-600">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm transition-all hover:border-slate-700 hover:bg-slate-800/50">
            {/* Subtle gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-800/20 opacity-0 transition-opacity group-hover:opacity-100" />

            <div className="relative">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn('rounded-lg p-2', colors.icon)}>
                            <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-medium text-slate-400">{label}</span>
                    </div>

                    {trend && (
                        <div className={cn(
                            'flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold',
                            trend.value > 0 ? 'bg-emerald-500/10 text-emerald-400' :
                                trend.value < 0 ? 'bg-red-500/10 text-red-400' :
                                    'bg-slate-500/10 text-slate-400'
                        )}>
                            {trend.value > 0 ? <TrendingUp size={12} /> :
                                trend.value < 0 ? <TrendingDown size={12} /> :
                                    <Minus size={12} />}
                            <span>{Math.abs(trend.value).toFixed(1)}%</span>
                        </div>
                    )}
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                    <p className={cn('text-3xl font-bold', colors.value)}>
                        {value}
                    </p>
                    {trend?.label && (
                        <span className="text-xs text-slate-500">{trend.label}</span>
                    )}
                </div>
            </div>
        </div>
    );
}
