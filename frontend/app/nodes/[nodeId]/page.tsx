'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Server, Activity, ShieldCheck, AlertCircle, Clock, Database, HardDrive, Wifi } from 'lucide-react';
import { fetchNodeDetails, fetchNodeHistory } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function NodeDetailPage() {
  const { nodeId } = useParams();
  const router = useRouter();
  
  const [node, setNode] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!nodeId) return;

    const loadData = async () => {
      try {
        const [nodeData, historyData] = await Promise.all([
          fetchNodeDetails(nodeId as string),
          fetchNodeHistory(nodeId as string)
        ]);
        setNode(nodeData);
        setHistory(historyData);
      } catch (err: any) {
        console.error('Failed to load node details', err);
        setError('Failed to load node details. The node might not exist.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [nodeId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !node) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 p-4">
        <div className="mb-4 text-red-500">
          <AlertCircle size={48} />
        </div>
        <h2 className="mb-4 text-xl font-bold text-white">Error</h2>
        <p className="mb-6 text-slate-400">{error || 'Node not found'}</p>
        <Link 
          href="/"
          className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-500"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const DetailItem = ({ icon: Icon, label, value, subValue }: any) => (
    <div className="flex items-start gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="rounded-lg bg-blue-500/10 p-3 text-blue-400">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-400">{label}</p>
        <p className="mt-1 font-mono text-slate-100">{value}</p>
        {subValue && <p className="text-xs text-slate-500">{subValue}</p>}
      </div>
    </div>
  );

  return (
    <main className="min-h-screen p-6 md:p-12">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div>
          <Link 
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
                <Server className="text-blue-500" />
                Node Details
              </h1>
              <p className="mt-2 font-mono text-slate-400">{node.nodeId}</p>
            </div>
            
            <div className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border",
              node.status === 'online' 
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" 
                : "border-red-500/30 bg-red-500/10 text-red-400"
            )}>
              {node.status === 'online' ? <ShieldCheck size={16} /> : <AlertCircle size={16} />}
              {node.status.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <DetailItem 
            icon={Wifi} 
            label="Network Address" 
            value={node.address} 
            subValue={node.is_public ? 'Public Access Enabled' : 'Private Access'}
          />
          <DetailItem 
            icon={Activity} 
            label="RPC Port" 
            value={node.rpc_port} 
          />
          <DetailItem 
            icon={Database} 
            label="Software Version" 
            value={node.version} 
          />
          <DetailItem 
            icon={HardDrive} 
            label="Storage Used" 
            value={`${(node.storage_used / 1024 / 1024 / 1024).toFixed(2)} GB`}
            subValue={`${node.storage_usage_percent}% of committed`}
          />
          <DetailItem 
            icon={Clock} 
            label="Uptime" 
            value={`${(node.uptime / 3600).toFixed(1)} hrs`} 
          />
          <DetailItem 
            icon={Clock} 
            label="Last Seen" 
            value={new Date(node.last_metric_timestamp || node.last_seen_timestamp).toLocaleString()} 
          />
        </div>

        {/* History Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 backdrop-blur-sm">
          <div className="border-b border-slate-800 p-6">
            <h2 className="text-xl font-bold text-white">Activity History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="bg-slate-900/50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Storage</th>
                  <th className="px-6 py-3">Uptime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {history.map((record: any, index: number) => (
                  <tr key={index} className="hover:bg-slate-800/30">
                    <td className="px-6 py-4 font-mono">
                      {new Date(record.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                        record.status === 'online' 
                          ? "bg-emerald-500/10 text-emerald-400" 
                          : "bg-red-500/10 text-red-400"
                      )}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {record.storage_usage_percent}%
                    </td>
                    <td className="px-6 py-4">
                      {(record.uptime / 3600).toFixed(1)}h
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      No history records found yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
