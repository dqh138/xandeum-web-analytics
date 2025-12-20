'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCircle, AlertTriangle, ExternalLink, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TelegramStatus {
    connected: boolean;
    username?: string;
    starredNodeIds?: string[];
}

export default function AlertsPage() {
    const [status, setStatus] = useState<TelegramStatus>({ connected: false });
    const [loading, setLoading] = useState(false);
    const [testLoading, setTestLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [settings, setSettings] = useState({ alertOnInactive: false, alertOnLowScore: false });
    const [hasSynced, setHasSynced] = useState(false);

    const fetchStatus = async () => {
        try {
            const res = await fetch('/telegram/status');
            const data = await res.json();
            setStatus(data);
            if (data.settings) {
                setSettings(data.settings);
            }

            // Sync starred nodes if connected and haven't synced yet
            if (data.connected && !hasSynced) {
                syncWithRemote(data.starredNodeIds || []);
                setHasSynced(true);
            }
        } catch (error) {
            console.error('Failed to fetch status:', error);
        }
    };

    const syncWithRemote = async (remoteIds: string[]) => {
        try {
            const stored = localStorage.getItem('xandeum_starred_nodes');
            const localIds: string[] = stored ? JSON.parse(stored) : [];

            // Merge Logic: Union of Local and Remote
            const mergedSet = new Set([...localIds, ...remoteIds]);
            const mergedIds = Array.from(mergedSet);

            // 1. Update Local Storage if different
            if (mergedIds.length !== localIds.length) {
                localStorage.setItem('xandeum_starred_nodes', JSON.stringify(mergedIds));
                // Dispatch event so other components (like Navigation) update immediately
                window.dispatchEvent(new Event('starred-nodes-updated'));
            }

            // 2. Update Remote if different (or if we just merged something new from local)
            // Ideally we only push if local had something that remote didn't.
            // Simplified: Push if the merged list size is different from remote list size
            // OR if we just want to ensure consistency.
            if (mergedIds.length !== remoteIds.length) {
                await fetch('/telegram/starred', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nodeIds: mergedIds })
                });
            }
        } catch (e) {
            console.error('Failed to sync starred nodes', e);
        }
    }

    const pushLocalToRemote = async () => {
        try {
            const stored = localStorage.getItem('xandeum_starred_nodes');
            const starredIds = stored ? JSON.parse(stored) : [];
            await fetch('/telegram/starred', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nodeIds: starredIds })
            });
        } catch (e) {
            console.error('Failed to push starred nodes to remote', e);
        }
    }

    // Listen for changes to starred nodes (from other tabs/components)
    useEffect(() => {
        const handleStorageUpdate = () => {
            if (status.connected && hasSynced) pushLocalToRemote();
        };
        window.addEventListener('starred-nodes-updated', handleStorageUpdate);
        return () => window.removeEventListener('starred-nodes-updated', handleStorageUpdate);
    }, [status.connected, hasSynced]);

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 5000); // Poll status every 5s
        return () => clearInterval(interval);
    }, []);

    const handleConnect = async () => {
        setLoading(true);
        try {
            const res = await fetch('/telegram/auth-link');
            const data = await res.json();
            if (data.url) {
                window.open(data.url, '_blank');
            } else {
                setMessage({ type: 'error', text: 'Failed to generate connection link.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error connecting to server.' });
        } finally {
            setLoading(false);
        }
    };

    const handleTestAlert = async () => {
        setTestLoading(true);
        setMessage(null);
        try {
            const res = await fetch('/telegram/test', { method: 'POST' });
            if (res.ok) {
                setMessage({ type: 'success', text: 'Test alert sent successfully!' });
            } else {
                setMessage({ type: 'error', text: 'Failed to send test alert.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error sending test alert.' });
        } finally {
            setTestLoading(false);
        }
    };

    const toggleSetting = async (key: 'alertOnInactive' | 'alertOnLowScore') => {
        const newSettings = { ...settings, [key]: !settings[key] };
        setSettings(newSettings); // Optimistic UI

        try {
            await fetch('/telegram/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSettings)
            });
        } catch (e) {
            console.error('Failed to update settings', e);
            setMessage({ type: 'error', text: 'Failed to save settings.' });
            setSettings(settings); // Revert
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 p-8 text-slate-200 ml-20 lg:ml-64">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto space-y-8"
            >
                <header className="space-y-4">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Alert Configurations
                    </h1>
                    <p className="text-slate-400">
                        Manage your notification settings and connect your preferred channels.
                    </p>
                </header>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Telegram Card */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                                    <Bell size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg text-white">Telegram Alerts</h3>
                                    <p className="text-sm text-slate-400">Get instant notifications on your device</p>
                                </div>
                            </div>
                            <div className={cn(
                                "px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5",
                                status.connected
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : "bg-slate-800 text-slate-400 border border-slate-700"
                            )}>
                                <div className={cn("w-1.5 h-1.5 rounded-full", status.connected ? "bg-emerald-400" : "bg-slate-400")} />
                                {status.connected ? "Connected" : "Disconnected"}
                            </div>
                        </div>

                        <div className="space-y-6">
                            {status.connected ? (
                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 space-y-2">
                                        <div className="flex items-center gap-2 text-emerald-400 font-medium">
                                            <CheckCircle size={18} />
                                            <span>Active Connection</span>
                                        </div>
                                        <p className="text-sm text-slate-400 ml-6">
                                            Connected as <span className="text-white font-mono">@{status.username || 'user'}</span>
                                        </p>
                                    </div>

                                    {/* Configuration Toggles */}
                                    <div className="border-t border-slate-800 pt-4 space-y-3">
                                        <h4 className="text-sm font-medium text-slate-300">Alert Conditions (Starred Nodes Only)</h4>

                                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                                            <div className="text-sm">
                                                <div className="text-slate-200">Node Inactive</div>
                                                <div className="text-slate-500 text-xs">Alert if node goes offline or degraded</div>
                                            </div>
                                            <button
                                                onClick={() => toggleSetting('alertOnInactive')}
                                                className={cn(
                                                    "w-11 h-6 flex items-center rounded-full px-1 transition-colors",
                                                    settings.alertOnInactive ? "bg-blue-500" : "bg-slate-700"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-4 h-4 rounded-full bg-white transition-transform",
                                                    settings.alertOnInactive ? "translate-x-5" : "translate-x-0"
                                                )} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                                            <div className="text-sm">
                                                <div className="text-slate-200">Low Performance Score</div>
                                                <div className="text-slate-500 text-xs">Alert if score drops below 50</div>
                                            </div>
                                            <button
                                                onClick={() => toggleSetting('alertOnLowScore')}
                                                className={cn(
                                                    "w-11 h-6 flex items-center rounded-full px-1 transition-colors",
                                                    settings.alertOnLowScore ? "bg-blue-500" : "bg-slate-700"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-4 h-4 rounded-full bg-white transition-transform",
                                                    settings.alertOnLowScore ? "translate-x-5" : "translate-x-0"
                                                )} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 space-y-2">
                                    <div className="flex items-center gap-2 text-amber-400 font-medium">
                                        <AlertTriangle size={18} />
                                        <span>Setup Required</span>
                                    </div>
                                    <p className="text-sm text-slate-400 ml-6">
                                        Connect our Telegram bot to receive real-time alerts about your nodes.
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                {!status.connected ? (
                                    <button
                                        onClick={handleConnect}
                                        disabled={loading}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ExternalLink size={18} />
                                        {loading ? 'Connecting...' : 'Connect Telegram'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleTestAlert}
                                        disabled={testLoading}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-all border border-slate-700 disabled:opacity-50"
                                    >
                                        <Send size={18} />
                                        {testLoading ? 'Sending...' : 'Send Test Alert'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Placeholder for future channels */}
                    <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 p-6 flex flex-col items-center justify-center text-center space-y-3 opacity-50">
                        <div className="p-3 rounded-full bg-slate-800/50 text-slate-600">
                            <Bell size={24} />
                        </div>
                        <h3 className="font-semibold text-slate-500">More Channels</h3>
                        <p className="text-sm text-slate-600">Email and Slack integration coming soon</p>
                    </div>
                </div>

                {/* Status Messages */}
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                            "p-4 rounded-xl border flex items-center gap-3",
                            message.type === 'success'
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                : "bg-red-500/10 border-red-500/20 text-red-400"
                        )}
                    >
                        {message.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                        <span>{message.text}</span>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
