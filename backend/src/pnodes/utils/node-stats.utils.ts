/**
 * Calculate the performance score for a node based on various metrics.
 * 
 * Score Components:
 * - Uptime Score (50%): Based on uptime_seconds vs maxUptime (benchmark).
 * - Latency Score (50%): Based on latency_ms (lower is better).
 * 
 * @param node The node object containing metrics
 * @param maxUptime The maximum uptime benchmark in seconds
 * @returns Score between 0 and 100
 */
export function calculatePerformanceScore(node: any, maxUptime: number): number {
    const metrics = node.current_metrics || {};
    const uptime = metrics.uptime_seconds || node.uptime || 0; // fallback for different object shapes
    const latency = metrics.latency_ms || node.latency || 9999;

    // 1. Uptime Score (50%)
    const uptimeScore = Math.min(1, uptime / maxUptime);

    // 2. Latency Score (50%)
    const latencyScore = Math.max(0, 1 - (latency / 500)); // 0ms = 1.0, 500ms = 0.0

    // Total Weighted Score (0-1 range)
    const totalScore = (uptimeScore * 0.5) + (latencyScore * 0.5);

    // Return 0-100 formatted string converted to number
    return Number((totalScore * 100).toFixed(2));
}
