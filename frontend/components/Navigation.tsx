'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, HardDrive, Activity, Calendar, Building2, ChevronLeft, ChevronRight, Calculator, List, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from '@/context/SidebarContext';
import { useStarredNodes } from '@/hooks/useStarredNodes';

const navItems = [
    { href: '/', label: 'Overview', icon: Home },
    { href: '/storage', label: 'Storage', icon: HardDrive },
    { href: '/health', label: 'Health', icon: Activity },
    { href: '/events', label: 'Events', icon: Calendar },
    { href: '/providers', label: 'Providers', icon: Building2 },
    { href: '/leaderboard', label: 'Leaderboard', icon: List },
    { href: '/starred', label: 'Starred', icon: Star },
    { href: '/stoinc', label: 'Calculator', icon: Calculator },
];

export function Navigation() {
    const pathname = usePathname();
    const { isCollapsed, toggleSidebar } = useSidebar();
    const { starredIds } = useStarredNodes();

    return (
        <motion.nav
            className="fixed left-0 top-0 z-50 h-screen border-r border-slate-800 bg-slate-900/95 p-4 backdrop-blur-md hidden lg:flex flex-col"
            initial={false}
            animate={{ width: isCollapsed ? 80 : 256 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            <div className="flex h-full flex-col">
                <div className="mb-8 flex items-center justify-between px-2">
                    <AnimatePresence mode="wait">
                        {!isCollapsed && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <h1 className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-xl font-bold text-transparent whitespace-nowrap">
                                    Xandeum
                                </h1>
                                <p className="text-xs text-slate-500 whitespace-nowrap">Analytics Dashboard</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        onClick={toggleSidebar}
                        className={cn(
                            "rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors",
                            isCollapsed ? "mx-auto" : "ml-auto"
                        )}
                    >
                        {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    </button>
                </div>

                <div className="flex flex-1 flex-col gap-2">
                    {navItems.map(({ href, label, icon: Icon }) => {
                        const isActive = pathname === href;
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    "group flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all relative",
                                    isActive
                                        ? "bg-blue-500/10 text-blue-400"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
                                    isCollapsed && "justify-center"
                                )}
                                title={isCollapsed ? label : undefined}
                            >
                                <div className="relative">
                                    <Icon size={20} className={cn(isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300")} />
                                    {label === 'Starred' && starredIds.length > 0 && (
                                        <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                                            {starredIds.length}
                                        </span>
                                    )}
                                </div>

                                <AnimatePresence>
                                    {!isCollapsed && (
                                        <motion.span
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: "auto" }}
                                            exit={{ opacity: 0, width: 0 }}
                                            className="whitespace-nowrap overflow-hidden"
                                        >
                                            {label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>

                                {isActive && !isCollapsed && (
                                    <motion.div
                                        layoutId="activeNav"
                                        className="absolute left-0 h-6 w-1 rounded-r-full bg-blue-500"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </div>

                <div className="mt-auto px-1">
                    <div className={cn("rounded-lg bg-slate-800/50 p-4", isCollapsed && "p-2 bg-transparent text-center")}>
                        <AnimatePresence>
                            {!isCollapsed && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-xs font-medium text-slate-400 mb-2 truncate"
                                >
                                    System Status
                                </motion.p>
                            )}
                        </AnimatePresence>

                        <div className={cn("flex items-center gap-2 text-emerald-400", isCollapsed && "justify-center")}>
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>

                            <AnimatePresence>
                                {!isCollapsed && (
                                    <motion.span
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: "auto" }}
                                        exit={{ opacity: 0, width: 0 }}
                                        className="text-xs whitespace-nowrap overflow-hidden"
                                    >
                                        Operational
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </motion.nav>
    );
}
