'use client';

import { LucideIcon, Inbox, AlertCircle, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon?: LucideIcon;
    title?: string;
    message: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    variant?: 'default' | 'error' | 'info';
}

const variantStyles = {
    default: {
        icon: 'text-slate-500',
        bg: 'bg-slate-800/30',
        border: 'border-slate-800',
    },
    error: {
        icon: 'text-red-400',
        bg: 'bg-red-500/5',
        border: 'border-red-500/20',
    },
    info: {
        icon: 'text-blue-400',
        bg: 'bg-blue-500/5',
        border: 'border-blue-500/20',
    },
};

export function EmptyState({
    icon: Icon = Inbox,
    title,
    message,
    action,
    variant = 'default',
}: EmptyStateProps) {
    const styles = variantStyles[variant];

    return (
        <div className={cn(
            'flex flex-col items-center justify-center rounded-xl border p-12 text-center',
            styles.bg,
            styles.border
        )}>
            <div className={cn(
                'mb-4 rounded-full p-4',
                variant === 'default' ? 'bg-slate-800/50' :
                    variant === 'error' ? 'bg-red-500/10' :
                        'bg-blue-500/10'
            )}>
                <Icon className={cn('h-8 w-8', styles.icon)} />
            </div>

            {title && (
                <h3 className="mb-2 text-lg font-semibold text-slate-200">{title}</h3>
            )}

            <p className="mb-6 max-w-md text-sm text-slate-400">{message}</p>

            {action && (
                <button
                    onClick={action.onClick}
                    className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}

// Specialized empty states for common scenarios
export function NoDataState({ message = 'No data available yet. Data will appear after the first sync.' }) {
    return (
        <EmptyState
            icon={Database}
            title="Gathering Data"
            message={message}
            variant="info"
        />
    );
}

export function ErrorState({
    message = 'Something went wrong. Please try again.',
    onRetry,
}: {
    message?: string;
    onRetry?: () => void;
}) {
    return (
        <EmptyState
            icon={AlertCircle}
            title="Error"
            message={message}
            variant="error"
            action={onRetry ? {
                label: 'Retry',
                onClick: onRetry,
            } : undefined}
        />
    );
}
