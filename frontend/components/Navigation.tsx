'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, HardDrive, Activity, Calendar, Building2, Calculator, List, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStarredNodes } from '@/hooks/useStarredNodes';

const navItems = [
    { href: '/', label: 'Overview', icon: Home },
    // { href: '/storage', label: 'Storage', icon: HardDrive },
    // { href: '/health', label: 'Health', icon: Activity },
    // { href: '/events', label: 'Events', icon: Calendar },
    // { href: '/providers', label: 'Providers', icon: Building2 },
    { href: '/leaderboard', label: 'Leaderboard', icon: List },
    { href: '/starred', label: 'Starred', icon: Star },
    { href: '/stoinc', label: 'Calculator', icon: Calculator },
];

export function Navigation() {
    const pathname = usePathname();
    const { starredIds } = useStarredNodes();

    return (
        <nav className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
            <div className="flex gap-2 rounded-full border border-slate-800 bg-slate-900/90 p-2 backdrop-blur-md shadow-2xl">
                {navItems.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
                                isActive
                                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/50"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <div className="relative">
                                <Icon size={16} />
                                {label === 'Starred' && starredIds.length > 0 && (
                                    <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                                        {starredIds.length}
                                    </span>
                                )}
                            </div>
                            <span className="hidden sm:inline">{label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
