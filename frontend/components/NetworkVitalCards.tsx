'use client';

import { Activity, Server, Zap, Clock } from 'lucide-react';
import { MetricCard } from '@/components/ui/MetricCard';

interface NetworkVitalCardsProps {
    snapshot: any; // NetworkSnapshot
    previousSnapshot?: any; // For trend calculation
    loading?: boolean;
}

export function NetworkVitalCards({ snapshot, previousSnapshot, loading = false }: NetworkVitalCardsProps) {
    if (loading || !snapshot) {
        return (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <MetricCard
                        key={i}
                        label="Loading..."
                        value="-"
                        icon={Activity}
                        isLoading={true}
                    />
                ))}
            </div>
        );
    }

    const { health, nodes, network, system } = snapshot;
    const prevHealth = previousSnapshot?.health;
    const prevNodes = previousSnapshot?.nodes;
    const prevNetwork = previousSnapshot?.network;
    const prevSystem = previousSnapshot?.system;

    // Health Score logic
    const healthScore = health?.score || 0;
    const healthColor = healthScore >= 80 ? 'green' : healthScore >= 50 ? 'orange' : 'red';
    const healthTrend = prevHealth ? healthScore - prevHealth.score : 0;

    // Active Nodes logic
    const activeNodes = nodes?.online || 0;
    const totalNodes = nodes?.total || 0;
    const activePercent = totalNodes > 0 ? (activeNodes / totalNodes) * 100 : 0;
    const nodesTrend = prevNodes ? ((activeNodes - prevNodes.online) / prevNodes.online) * 100 : 0; // Check logic

    // Latency
    const latency = network?.average_latency_ms || 0;
    const latencyColor = latency < 200 ? 'emerald' : latency < 500 ? 'orange' : 'red';
    // Latency trend: Positive means worse (increased latency). 
    // We pass raw trend. MetricCard makes positive Green UP, negative RED DOWN.
    // Ideally we want Negative (Latency Down) -> Green.
    const latencyTrend = prevNetwork && prevNetwork.average_latency_ms > 0
        ? ((latency - prevNetwork.average_latency_ms) / prevNetwork.average_latency_ms) * 100
        : 0;

    // Uptime
    const uptime = system?.average_uptime_hours || 0;
    const uptimeTrend = prevSystem && prevSystem.average_uptime_hours > 0
        ? ((uptime - prevSystem.average_uptime_hours) / prevSystem.average_uptime_hours) * 100
        : 0;

    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
                label="Network Health"
                value={`${healthScore.toFixed(1)}/100`}
                icon={Activity}
                color={healthColor as any}
                trend={{
                    value: healthTrend,
                    label: 'Stability Score'
                }}
            />

            <MetricCard
                label="Active Nodes"
                value={activeNodes.toLocaleString()}
                icon={Server}
                color="blue"
                trend={{
                    value: nodesTrend,
                    label: `of ${totalNodes} total (${activePercent.toFixed(1)}%)`
                }}
            />

            <MetricCard
                label="Avg Latency"
                value={`${Math.round(latency)} ms`}
                icon={Zap}
                color={latencyColor as any}
                trend={{
                    value: latencyTrend,
                    label: 'Network Response'
                }}
            />

            <MetricCard
                label="Avg Uptime"
                value={`${Math.floor(uptime)}h`}
                icon={Clock}
                color="purple"
                trend={{
                    value: uptimeTrend,
                    label: 'System Stability'
                }}
            />
        </div>
    );
}
