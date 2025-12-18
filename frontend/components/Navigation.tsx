'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, HardDrive, Activity, Calendar, Building2, Calculator, List } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { href: '/', label: 'Overview', icon: Home },
    // { href: '/storage', label: 'Storage', icon: HardDrive },
    // { href: '/health', label: 'Health', icon: Activity },
    // { href: '/events', label: 'Events', icon: Calendar },
    // { href: '/providers', label: 'Providers', icon: Building2 },
    { href: '/leaderboard', label: 'Leaderboard', icon: List },
    { href: '/stoinc', label: 'Calculator', icon: Calculator },
];

export function Navigation() {
    const pathname = usePathname();

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
                            <Icon size={16} />
                            <span className="hidden sm:inline">{label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
