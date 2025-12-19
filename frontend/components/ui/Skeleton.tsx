'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div className={cn('animate-pulse rounded-lg bg-slate-800', className)} />
    );
}

// Specialized skeleton loaders for common patterns
export function MetricCardSkeleton() {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="mt-4 h-8 w-32" />
        </div>
    );
}

export function ChartSkeleton({ height = 'h-64' }: { height?: string }) {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="mb-4 flex items-center justify-between">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-8 w-24" />
            </div>
            <Skeleton className={cn('w-full', height)} />
        </div>
    );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
    return (
        <div className="flex gap-4 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            {Array.from({ length: columns }).map((_, i) => (
                <Skeleton key={i} className="h-5 flex-1" />
            ))}
        </div>
    );
}

export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
                <TableRowSkeleton key={i} columns={columns} />
            ))}
        </div>
    );
}

export function CardSkeleton() {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <Skeleton className="mb-4 h-6 w-48" />
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="mb-2 h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
        </div>
    );
}
