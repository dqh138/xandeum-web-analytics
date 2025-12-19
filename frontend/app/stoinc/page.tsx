'use client';

import { StoincCalculator } from '@/components/StoincCalculator';

export default function StoincPage() {
    return (
        <main className="min-h-screen bg-slate-950 p-6 md:p-12">
            <div className="mx-auto max-w-7xl space-y-8">
                <header>
                    <h1 className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-4xl font-bold text-transparent">
                        STOINC Calculator
                    </h1>
                    <p className="mt-2 text-slate-400">
                        Estimate your Storage Income rewards based on your node performance and network growth.
                    </p>
                </header>

                <StoincCalculator />

                <footer className="mt-20 border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
                    <p>© 2025 Xandeum Analytics. Estimates are for reference only.</p>
                </footer>
            </div>
        </main>
    );
}
