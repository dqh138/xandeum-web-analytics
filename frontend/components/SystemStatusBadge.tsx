import { RefreshCw, CheckCircle, AlertOctagon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SystemStatusProps {
  status: 'success' | 'error' | 'syncing';
  lastUpdated: string;
  message?: string;
}

export function SystemStatusBadge({ status, lastUpdated, message }: SystemStatusProps) {
  return (
    <div className="flex items-center gap-4 rounded-full border border-slate-800 bg-slate-900/50 px-4 py-1.5 backdrop-blur-md">
      <div className="flex items-center gap-2">
        {status === 'syncing' && <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />}
        {status === 'success' && <CheckCircle className="h-4 w-4 text-emerald-400" />}
        {status === 'error' && <AlertOctagon className="h-4 w-4 text-red-400" />}
        
        <span className={cn(
          "text-xs font-medium",
          status === 'syncing' && "text-blue-400",
          status === 'success' && "text-emerald-400",
          status === 'error' && "text-red-400"
        )}>
          {status === 'syncing' ? 'Syncing...' : status === 'success' ? 'System Healthy' : 'System Error'}
        </span>
      </div>
      
      <div className="h-3 w-px bg-slate-800" />
      
      <div className="text-xs text-slate-400">
        Updated: <span className="text-slate-200">{lastUpdated}</span>
      </div>
    </div>
  );
}
