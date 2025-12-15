import { AlertTriangle, CheckCircle, Info, ArrowUpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Event {
    event_id: string;
    type: string;
    category: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    details: {
        message: string;
    };
    timestamp: string;
}

interface EventsFeedProps {
    events: Event[];
}

export function EventsFeed({ events }: EventsFeedProps) {
    const getIcon = (severity: string) => {
        switch (severity) {
            case 'critical':
            case 'error':
                return <AlertTriangle className="h-4 w-4 text-red-400" />;
            case 'warning':
                return <AlertTriangle className="h-4 w-4 text-orange-400" />;
            case 'info':
            default:
                return <Info className="h-4 w-4 text-blue-400" />;
        }
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-200">
                <ArrowUpCircle className="text-blue-400" />
                Recent Activity
            </h3>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {events.length === 0 ? (
                    <p className="text-sm text-slate-500">No recent activity.</p>
                ) : (
                    events.map((event) => (
                        <div key={event.event_id} className="flex gap-3 text-sm">
                            <div className="mt-0.5">{getIcon(event.severity)}</div>
                            <div className="flex-1">
                                <p className="text-slate-300">{event.details.message}</p>
                                <div className="mt-1 flex gap-2 text-xs text-slate-500">
                                    <span suppressHydrationWarning>{formatTime(event.timestamp)}</span>
                                    <span>•</span>
                                    <span className="uppercase">{event.category}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
