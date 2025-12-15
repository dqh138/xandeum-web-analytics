import { Database } from 'lucide-react';

interface Provider {
    provider_id: string;
    provider_name: string;
    nodes: {
        total_count: number;
    };
    metrics: {
        total_storage_committed: number;
        average_uptime_hours: number;
    };
}

interface ProviderListProps {
    providers: Provider[];
}

export function ProviderList({ providers }: ProviderListProps) {
    const formatStorage = (bytes: number) => {
        return (bytes / 1e12).toFixed(2) + ' TB';
    };

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-200">
                <Database className="text-purple-400" />
                Top Storage Providers
            </h3>

            <div className="space-y-4">
                {providers.slice(0, 5).map((provider, index) => (
                    <div key={provider.provider_id} className="flex items-center justify-between border-b border-slate-800/50 pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-xs font-medium text-slate-400">
                                {index + 1}
                            </span>
                            <div>
                                <p className="font-medium text-slate-200">{provider.provider_name}</p>
                                <p className="text-xs text-slate-500">{provider.nodes.total_count} nodes</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-mono text-sm font-medium text-purple-400">
                                {formatStorage(provider.metrics.total_storage_committed)}
                            </p>
                            <p className="text-xs text-slate-500">
                                {provider.metrics.average_uptime_hours.toFixed(1)}h avg uptime
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
