/**
 * Format utilities for displaying metrics safely
 * Handles NaN, Infinity, and zero values gracefully
 */

export function formatNumber(
    value: number | undefined | null,
    options?: {
        decimals?: number;
        fallback?: string;
        prefix?: string;
        suffix?: string;
    }
): string {
    const { decimals = 0, fallback = 'N/A', prefix = '', suffix = '' } = options || {};

    if (value === undefined || value === null || isNaN(value) || !isFinite(value)) {
        return fallback;
    }

    return `${prefix}${value.toFixed(decimals)}${suffix}`;
}

export function formatPercentage(
    value: number | undefined | null,
    options?: {
        decimals?: number;
        fallback?: string;
    }
): string {
    return formatNumber(value, {
        ...options,
        suffix: '%',
    });
}

export function formatBytes(
    bytes: number | undefined | null,
    options?: {
        decimals?: number;
        fallback?: string;
    }
): string {
    const { decimals = 2, fallback = 'N/A' } = options || {};

    if (bytes === undefined || bytes === null || isNaN(bytes) || !isFinite(bytes)) {
        return fallback;
    }

    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

    // Handle negative values
    const sign = bytes < 0 ? '-' : '';
    const absoluteBytes = Math.abs(bytes);

    const i = Math.floor(Math.log(absoluteBytes) / Math.log(k));

    return `${sign}${(absoluteBytes / Math.pow(k, i)).toFixed(decimals)} ${sizes[i]}`;
}

export function formatDuration(
    seconds: number | undefined | null,
    options?: {
        fallback?: string;
        short?: boolean;
    }
): string {
    const { fallback = 'N/A', short = false } = options || {};

    if (seconds === undefined || seconds === null || isNaN(seconds) || !isFinite(seconds)) {
        return fallback;
    }

    if (seconds < 60) {
        return short ? `${Math.floor(seconds)}s` : `${Math.floor(seconds)} seconds`;
    }

    if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        return short ? `${minutes}m` : `${minutes} minutes`;
    }

    if (seconds < 86400) {
        const hours = Math.floor(seconds / 3600);
        return short ? `${hours}h` : `${hours} hours`;
    }

    const days = Math.floor(seconds / 86400);
    return short ? `${days}d` : `${days} days`;
}

export function formatRelativeTime(
    timestamp: string | number | Date | undefined | null,
    options?: {
        fallback?: string;
    }
): string {
    const { fallback = 'Unknown' } = options || {};

    if (!timestamp) return fallback;

    try {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return fallback;

        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSec = Math.floor(diffMs / 1000);

        if (diffSec < 60) return 'Just now';
        if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
        if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
        if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

        return date.toLocaleDateString();
    } catch {
        return fallback;
    }
}

/**
 * Check if a value is valid for display
 */
export function isValidMetric(value: any): boolean {
    return value !== undefined &&
        value !== null &&
        !isNaN(value) &&
        isFinite(value);
}

/**
 * Safe division that returns 0 instead of NaN
 */
export function safeDivide(numerator: number, denominator: number): number {
    if (denominator === 0 || !isValidMetric(numerator) || !isValidMetric(denominator)) {
        return 0;
    }
    return numerator / denominator;
}

/**
 * Calculate percentage safely
 */
export function safePercentage(part: number, total: number): number {
    if (total === 0 || !isValidMetric(part) || !isValidMetric(total)) {
        return 0;
    }
    return (part / total) * 100;
}
