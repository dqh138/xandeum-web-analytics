'use client';

import { useState, useEffect } from 'react';
import { Calculator, Coins, Server, Database, TrendingUp, Info } from 'lucide-react';

export function StoincCalculator() {
    // User Inputs
    const [pNodes, setPNodes] = useState(1);
    const [storage, setStorage] = useState(100); // GB
    const [performance, setPerformance] = useState(1.0);
    const [stake, setStake] = useState(1000); // XAND
    const [boost, setBoost] = useState(1.0);

    // Network Globals (Estimates)
    const [totalNetworkCredits, setTotalNetworkCredits] = useState(1000000);
    const [totalFees, setTotalFees] = useState(50000); // in STOINC/XAND? Assuming monetary unit
    const [pNodeShare, setPNodeShare] = useState(0.3); // 30%

    // Calculated Results
    const [storageCredits, setStorageCredits] = useState(0);
    const [myBoostedCredits, setMyBoostedCredits] = useState(0);
    const [stoincReward, setStoincReward] = useState(0);
    const [networkShare, setNetworkShare] = useState(0);

    useEffect(() => {
        // Formula 1: Storage Credits
        // storageCredits = pNodes × storageSpace × performanceScore × stake
        const baseCredits = pNodes * storage * performance * stake;
        setStorageCredits(baseCredits);

        // Apply Boost
        const boosted = baseCredits * boost;
        setMyBoostedCredits(boosted);

        // Formula 2: STOINC Calculation
        // STOINC = (boostedCredits / totalBoostedCredits) × totalFees × pNodeShare
        // Note: totalBoostedCredits should ideally include my boosted credits, but for estimation
        // if totalNetworkCredits is large, adding mine might be negligible or we treat totalNetworkCredits as "everyone else + me"
        // Let's assume totalNetworkCredits is the MACRO global pool.

        // Safety check for div by zero
        const safeTotalCredits = Math.max(totalNetworkCredits, boosted, 1);

        const myShare = boosted / safeTotalCredits;
        setNetworkShare(myShare);

        const stoinc = myShare * totalFees * pNodeShare;
        setStoincReward(stoinc);

    }, [pNodes, storage, performance, stake, boost, totalNetworkCredits, totalFees, pNodeShare]);

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            {/* LEFT COLUMN: INPUTS */}
            <div className="space-y-6">

                {/* User Stats Card */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                    <div className="mb-4 flex items-center gap-2 text-blue-400">
                        <Server className="h-5 w-5" />
                        <h3 className="font-semibold text-slate-200">Your Node Stats</h3>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-400">pNodes Count</label>
                            <input
                                type="number"
                                min="0"
                                value={pNodes}
                                onChange={(e) => setPNodes(Number(e.target.value))}
                                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-400">Storage (GB)</label>
                            <input
                                type="number"
                                min="0"
                                value={storage}
                                onChange={(e) => setStorage(Number(e.target.value))}
                                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-400">Performance (0-1.0)</label>
                            <input
                                type="number"
                                min="0"
                                max="1"
                                step="0.1"
                                value={performance}
                                onChange={(e) => setPerformance(Number(e.target.value))}
                                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-400">Staked XAND</label>
                            <input
                                type="number"
                                min="0"
                                value={stake}
                                onChange={(e) => setStake(Number(e.target.value))}
                                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <label className="text-xs font-medium text-slate-400">Boost Multiplier (e.g. 1.0, 1.5)</label>
                            <div className="relative">
                                <TrendingUp className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="number"
                                    min="1"
                                    step="0.1"
                                    value={boost}
                                    onChange={(e) => setBoost(Number(e.target.value))}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-800 pl-10 pr-3 py-2 text-slate-200 focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Network Values Card */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                    <div className="mb-4 flex items-center gap-2 text-purple-400">
                        <Database className="h-5 w-5" />
                        <h3 className="font-semibold text-slate-200">Network Assumptions</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                            <label className="text-xs font-medium text-slate-400">Total Network Boosted Credits</label>
                            <input
                                type="number"
                                value={totalNetworkCredits}
                                onChange={(e) => setTotalNetworkCredits(Number(e.target.value))}
                                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-400">Total Fees (Epoch)</label>
                            <input
                                type="number"
                                value={totalFees}
                                onChange={(e) => setTotalFees(Number(e.target.value))}
                                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-400">pNode Share (0-1.0)</label>
                            <input
                                type="number"
                                step="0.01"
                                max="1"
                                value={pNodeShare}
                                onChange={(e) => setPNodeShare(Number(e.target.value))}
                                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

            </div>

            {/* RIGHT COLUMN: RESULTS & FORMULA */}
            <div className="space-y-6">

                {/* Results Card */}
                <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-slate-900 p-8 shadow-2xl">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Coins size={120} />
                    </div>

                    <h2 className="mb-6 text-2xl font-bold text-white flex items-center gap-3">
                        <Calculator className="text-amber-400" />
                        Projected Rewards
                    </h2>

                    <div className="space-y-6">
                        <div>
                            <div className="text-sm text-slate-400 mb-1">Your Storage Credits (Boosted)</div>
                            <div className="text-3xl font-mono font-bold text-blue-400">
                                {Math.floor(myBoostedCredits).toLocaleString()}
                                <span className="text-sm text-slate-500 ml-2 font-normal">
                                    (Base: {Math.floor(storageCredits).toLocaleString()})
                                </span>
                            </div>
                        </div>

                        <div>
                            <div className="text-sm text-slate-400 mb-1">Network Share</div>
                            <div className="text-2xl font-mono font-bold text-purple-400">
                                {(networkShare * 100).toFixed(6)}%
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-700">
                            <div className="text-sm text-amber-400 font-medium mb-1 uppercase tracking-wider">Estimated STOINC Income</div>
                            <div className="text-5xl font-mono font-bold text-white tracking-tight">
                                {stoincReward.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </div>
                            <div className="mt-2 text-xs text-slate-500">
                                * Estimates per epoch based on current inputs
                            </div>
                        </div>
                    </div>
                </div>

                {/* Formula Card */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                    <div className="mb-4 flex items-center gap-2 text-slate-200">
                        <Info className="h-5 w-5 text-slate-400" />
                        <h3 className="font-semibold">How it works</h3>
                    </div>

                    <div className="space-y-4 text-sm font-mono text-slate-400">
                        <div className="rounded-lg bg-slate-950 p-4 border border-slate-800">
                            <div className="text-xs text-slate-500 mb-2 font-sans font-semibold uppercase">Step 1: Calculate Credits</div>
                            <p>
                                <span className="text-blue-400">storageCredits</span> =
                                <br />
                                pNodes × storage × performance × stake
                            </p>
                        </div>

                        <div className="rounded-lg bg-slate-950 p-4 border border-slate-800">
                            <div className="text-xs text-slate-500 mb-2 font-sans font-semibold uppercase">Step 2: Boost Factors</div>
                            <p>
                                <span className="text-purple-400">boostedCredits</span> =
                                <br />
                                storageCredits × boostMultiplier
                            </p>
                        </div>

                        <div className="rounded-lg bg-slate-950 p-4 border border-slate-800">
                            <div className="text-xs text-slate-500 mb-2 font-sans font-semibold uppercase">Step 3: Final Reward</div>
                            <p>
                                <span className="text-amber-400">STOINC</span> =
                                <br />
                                (boostedCredits / TotalNetwork) × Fees × Share
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
