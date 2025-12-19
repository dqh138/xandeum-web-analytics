'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Keyboard, X, Command } from 'lucide-react';

export function GlobalShortcuts() {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isInput = ['INPUT', 'TEXTAREA'].includes(target.tagName);

            // Toggle Help with '?' (Shift + /)
            if (e.key === '?' && !isInput) {
                setIsOpen((prev) => !prev);
            }
            // Close on Esc
            if (e.key === 'Escape') {
                setIsOpen(false);
            }

            // Focus Search with '/'
            if (e.key === '/' && !isInput) {
                e.preventDefault();
                const searchInput = document.querySelector('input[type="text"]');
                if (searchInput) {
                    (searchInput as HTMLElement).focus();
                }
            }

            // Navigation Shortcuts (Cmd/Ctrl + Key)
            if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
                switch (e.key) {
                    case 'l':
                        e.preventDefault();
                        router.push('/leaderboard');
                        setIsOpen(false);
                        break;
                    case 's':
                        e.preventDefault();
                        router.push('/storage');
                        setIsOpen(false);
                        break;
                    case 'h':
                        e.preventDefault();
                        router.push('/health');
                        setIsOpen(false);
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
                    >
                        <div className="flex items-center justify-between border-b border-slate-800 p-4">
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                                <Keyboard className="text-blue-400" /> Keyboard Shortcuts
                            </h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            <ShortcutItem keys={['?']} description="Toggle this help menu" />
                            <ShortcutItem keys={['/']} description="Focus search input" />
                            <ShortcutItem keys={['Esc']} description="Close modals or clear selection" />

                            <div className="mt-6 pt-4 border-t border-slate-800">
                                <h3 className="text-xs font-semibold uppercase text-slate-500 mb-3">Navigation</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex items-center gap-2 text-sm text-slate-300">
                                        <Command size={14} /> + <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-xs">L</span> Leaderboard
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-300">
                                        <Command size={14} /> + <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-xs">S</span> Storage
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-300">
                                        <Command size={14} /> + <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-xs">H</span> Health
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-950 p-4 text-center text-xs text-slate-500">
                            Press '?' anytime to see this list.
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function ShortcutItem({ keys, description }: { keys: string[]; description: string }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">{description}</span>
            <div className="flex gap-2">
                {keys.map((k) => (
                    <kbd
                        key={k}
                        className="min-w-[24px] rounded bg-slate-800 px-2 py-1 text-center font-mono text-xs font-bold text-slate-200 shadow-sm border border-slate-700"
                    >
                        {k}
                    </kbd>
                ))}
            </div>
        </div>
    );
}
