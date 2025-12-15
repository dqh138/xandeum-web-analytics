import { useState } from 'react';
import Link from 'next/link';
import { Search, Server, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Node {
  node_id: string; // Changed from nodeId to match backend API
  address: string;
  status: string;
  version: string;
  is_public: boolean;
  rpc_port: number;
}

interface NodeListProps {
  nodes: Node[];
}

export function NodeList({ nodes }: NodeListProps) {
  const [search, setSearch] = useState('');

  const filteredNodes = nodes.filter(node =>
    node.node_id.toLowerCase().includes(search.toLowerCase()) ||
    node.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
          <Server className="text-blue-400" />
          Network Nodes
          <span className="ml-2 rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
            {nodes.length}
          </span>
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-64 rounded-lg border border-slate-700 bg-slate-800/50 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredNodes.map((node, index) => (
          <Link href={`/nodes/${node.node_id}`} key={node.node_id} className="block">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="group relative h-full cursor-pointer overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm transition-all hover:border-blue-500/50 hover:bg-slate-800/50"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

              <div className="mb-4 flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-medium text-blue-400">
                      {node.node_id.slice(0, 8)}...{node.node_id.slice(-8)}
                    </span>
                  </div>
                  <div className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                    node.status === 'online'
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-red-500/10 text-red-400"
                  )}>
                    {node.status === 'online' ? <ShieldCheck size={12} /> : <AlertCircle size={12} />}
                    {node.status.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-400">
                <div className="flex justify-between">
                  <span>Address:</span>
                  <span className="font-mono text-slate-200">{node.address}</span>
                </div>
                <div className="flex justify-between">
                  <span>RPC Port:</span>
                  <span className="font-mono text-slate-200">{node.rpc_port}</span>
                </div>
                <div className="flex justify-between">
                  <span>Version:</span>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-slate-300">
                    {node.version}
                  </span>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>

      {filteredNodes.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center text-slate-500">
          No nodes found matching your search.
        </div>
      )}
    </div>
  );
}
