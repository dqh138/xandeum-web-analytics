'use client';

import { useEffect, useState } from 'react';
import { HardDrive } from 'lucide-react';
import { fetchEvents, fetchNetworkInfo, fetchPNodes, fetchProviders, fetchSystemStatus, fetchNetworkHistory } from '@/lib/api';
import { SystemStatusBadge } from '@/components/SystemStatusBadge';
import { NetworkVitalCards } from '@/components/NetworkVitalCards';
import { StorageCapacityGauge } from '@/components/StorageCapacityGauge';
import { NetworkGrowthChart } from '@/components/NetworkGrowthChart';
import { TopPerformersTable } from '@/components/TopPerformersTable';
import { EventsFeed } from '@/components/EventsFeed';
import { GeoMap } from '@/components/GeoMap';
import { useSidebar } from '@/context/SidebarContext';
import { cn } from '@/lib/utils';

interface DashboardData {
  nodes: any[];
  network: any;
  systemStatus: any;
  events: any[];
  providers: any[];
  history: any[];
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isCollapsed } = useSidebar();

  const fetchData = async () => {
    try {
      const [nodes, network, systemStatus, events, providers, history] = await Promise.all([
        fetchPNodes(),
        fetchNetworkInfo(),
        fetchSystemStatus(),
        fetchEvents(20),
        fetchProviders(),
        fetchNetworkHistory(30), // Fetch 30 snapshots for trend
      ]);
      setData({ nodes: nodes || [], network, systemStatus, events, providers, history: history || [] });
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch data', err);
      setError(err.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30s polling
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-slate-400">Loading network data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <HardDrive className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-white">Connection Error</h2>
          <p className="mb-6 text-slate-400">{error}. Please ensure the backend server is running on port 3001.</p>
          <button
            onClick={() => { setLoading(true); fetchData(); }}
            className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-500"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Calculate metrics
  const onlineNodes = data.nodes.filter((n: any) => n.status === 'online');
  const totalStorage = onlineNodes.reduce((sum: number, n: any) => sum + (n.current_metrics?.storage_committed || 0), 0);
  const usedStorage = onlineNodes.reduce((sum: number, n: any) => sum + (n.current_metrics?.storage_used || 0), 0);

  // Parse History for Trends & Vitals
  let sortedHistory: any[] = [];
  let latestSnapshot = null;
  let previousSnapshot = null;
  let capacityTrend = 0;
  let usageTrend = 0;

  if (data.history.length > 0) {
    sortedHistory = [...data.history].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    latestSnapshot = sortedHistory[sortedHistory.length - 1];
    previousSnapshot = sortedHistory.length > 1 ? sortedHistory[sortedHistory.length - 2] : null;

    if (latestSnapshot && previousSnapshot) {
      // Capacity Trend
      if (previousSnapshot.storage?.total_committed > 0) {
        capacityTrend = ((latestSnapshot.storage.total_committed - previousSnapshot.storage.total_committed) / previousSnapshot.storage.total_committed) * 100;
      }
      // Usage Trend
      const prevUsed = previousSnapshot.storage?.total_used || 0;
      const curUsed = latestSnapshot.storage?.total_used || 0;
      if (prevUsed > 0) {
        usageTrend = ((curUsed - prevUsed) / prevUsed) * 100;
      }
    }
  }

  return (
    <main className={cn(
      "min-h-screen p-6 md:p-12 transition-all duration-300",
      isCollapsed ? "lg:pl-28" : "lg:pl-72"
    )}>
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <header className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div>
            <h1 className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-4xl font-bold text-transparent">
              Network Command Center
            </h1>
            <p className="mt-2 text-slate-400">Real-time insights & performance analytics</p>
          </div>

          <SystemStatusBadge
            status={data.systemStatus?.sync_status || 'success'}
            lastUpdated={data.systemStatus?.last_sync_timestamp ? new Date(data.systemStatus.last_sync_timestamp).toLocaleTimeString() : '-'}
            message={data.systemStatus?.last_error_message}
          />
        </header>

        {/* Vital Signs Row */}
        <NetworkVitalCards
          snapshot={latestSnapshot}
          previousSnapshot={previousSnapshot}
          loading={!latestSnapshot}
        />

        {/* Bento Grid Layout - Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Storage Gauge */}
          <StorageCapacityGauge
            totalStorage={totalStorage}
            usedStorage={usedStorage}
            capacityTrend={capacityTrend}
            usageTrend={usageTrend}
          />

          {/* Growth Chart */}
          <NetworkGrowthChart history={data.history} />
        </div>

        {/* Middle Section - Performance & Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          <TopPerformersTable nodes={data.nodes} limit={5} />
          <EventsFeed events={data.events} />
        </div>

        {/* Global Map */}
        <GeoMap nodes={data.nodes} />

        {/* Footer */}
        <footer className="mt-12 border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
          <p>© 2025 Xandeum Analytics. Connected to {data.network?.rpcEndpoint}</p>
        </footer>
      </div>
    </main>
  );
}