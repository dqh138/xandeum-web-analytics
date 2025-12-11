'use client';

import { useEffect, useState } from 'react';
import { Activity, Database, HardDrive, Server } from 'lucide-react';
import { fetchNetworkInfo, fetchPNodes, fetchSystemStatus } from '@/lib/api';
import { StatsCard } from '@/components/StatsCard';
import { NodeList } from '@/components/NodeList';
import { SystemStatusBadge } from '@/components/SystemStatusBadge';

interface DashboardData {
  nodes: any[];
  network: any;
  systemStatus: any;
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [nodes, network, systemStatus] = await Promise.all([
        fetchPNodes(),
        fetchNetworkInfo(),
        fetchSystemStatus(),
      ]);
      setData({ nodes, network, systemStatus });
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

  const activeNodes = data.nodes.filter((n: any) => n.status === 'online').length;
  
  return (
    <main className="min-h-screen p-6 md:p-12">
      <div className="mx-auto max-w-7xl space-y-12">
        {/* Header */}
        <header className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div>
            <h1 className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-4xl font-bold text-transparent">
              Xandeum Analytics
            </h1>
            <p className="mt-2 text-slate-400">Real-time Network Explorer & Monitor</p>
          </div>
          
          <SystemStatusBadge 
            status={data.systemStatus?.sync_status || 'success'}
            lastUpdated={data.systemStatus ? new Date(data.systemStatus.last_sync_timestamp).toLocaleTimeString() : '-'}
            message={data.systemStatus?.last_error_message}
          />
        </header>

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard 
            label="Total Nodes" 
            value={data.nodes.length} 
            icon={Server} 
            color="blue" 
          />
          <StatsCard 
            label="Active Nodes" 
            value={activeNodes} 
            icon={Activity} 
            color="green" 
          />
          <StatsCard 
            label="Network Version" 
            value={data.network?.version?.['solana-core']?.split('-')[0] || 'Unknown'} 
            icon={Database} 
            color="purple" 
          />
          <StatsCard 
            label="Health Status" 
            value={data.network?.health?.healthy ? 'Healthy' : 'Unhealthy'} 
            icon={HardDrive} 
            color="orange" 
          />
        </div>

        {/* Node List */}
        <NodeList nodes={data.nodes} />
        
        {/* Footer */}
        <footer className="mt-20 border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
          <p>© 2025 Xandeum Analytics. Connected to {data.network?.rpcEndpoint}</p>
        </footer>
      </div>
    </main>
  );
}