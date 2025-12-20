'use client';

import { useState, useEffect } from 'react';
import { Calculator, Coins, Server, Database, TrendingUp, Info, Activity, DollarSign, Clock } from 'lucide-react';

export function StoincCalculator() {
    // User Inputs
    const [pNodes, setPNodes] = useState(1);
    const [storage, setStorage] = useState(100); // GB
    const [performance, setPerformance] = useState(0.9);
    const [stake, setStake] = useState(1000); // XAND
    const [boost, setBoost] = useState(1.0);

    // Financial Inputs
    const [investmentCost, setInvestmentCost] = useState(2000); // $
    const [stoincPrice, setStoincPrice] = useState(0.05); // $
    const [epochsPerDay, setEpochsPerDay] = useState(1);

    // Network Globals (Estimates)
    const [totalNetworkCredits, setTotalNetworkCredits] = useState(5000000);
    const [totalFees, setTotalFees] = useState(100000);
    const [pNodeShare, setPNodeShare] = useState(0.3); // 30%

    // Calculated Results
    const [storageCredits, setStorageCredits] = useState(0);
    const [myBoostedCredits, setMyBoostedCredits] = useState(0);
    const [stoincReward, setStoincReward] = useState(0);
    const [networkShare, setNetworkShare] = useState(0);
    const [dailyIncome, setDailyIncome] = useState(0);
    const [breakEvenDays, setBreakEvenDays] = useState(0);

    const applyScenario = (type: 'conservative' | 'moderate' | 'aggressive') => {
        switch (type) {
            case 'conservative':
                setPerformance(0.7);
                setBoost(1.0);
                setTotalNetworkCredits(10000000); // Higher competition
                setTotalFees(50000); // Lower fees
                break;
            case 'moderate':
                setPerformance(0.9);
                setBoost(1.2);
                setTotalNetworkCredits(5000000);
                setTotalFees(100000);
                break;
            case 'aggressive':
                setPerformance(1.0);
                setBoost(2.0);
                setTotalNetworkCredits(3000000); // Lower competition
                setTotalFees(200000); // High fees
                break;
        }
    };

    useEffect(() => {
        // Formula 1: Storage Credits
        const baseCredits = pNodes * storage * performance * stake;
        setStorageCredits(baseCredits);

        // Apply Boost
        const boosted = baseCredits * boost;
        setMyBoostedCredits(boosted);

        // Formula 2: STOINC Calculation
        const safeTotalCredits = Math.max(totalNetworkCredits, boosted, 1);
        const myShare = boosted / safeTotalCredits;
        setNetworkShare(myShare);

        const stoincPerEpoch = myShare * totalFees * pNodeShare;
        setStoincReward(stoincPerEpoch);

        // Financials
        const dailyStoinc = stoincPerEpoch * epochsPerDay;
        const dailyUsd = dailyStoinc * stoincPrice;
        setDailyIncome(dailyUsd);

        const days = dailyUsd > 0 ? investmentCost / dailyUsd : 9999;
        setBreakEvenDays(days);

    }, [pNodes, storage, performance, stake, boost, totalNetworkCredits, totalFees, pNodeShare, epochsPerDay, investmentCost, stoincPrice]);

    const InputRange = ({ label, value, min, max, step, onChange, icon: Icon, unit }: any) => (
        <div className="space-y-3">
            <div className="flex justify-between">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-400">
                    {Icon && <Icon className="h-3 w-3" />}
                    {label}
                </label>
                <span className="font-mono text-xs font-bold text-white">{value} {unit}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-blue-500"
            />
        </div>
    );

    return (
        <div className="grid gap-8 lg:grid-cols-2">

            {/* LEFT COLUMN: CONTROLS */}
            <div className="space-y-8">

                {/* Scenarios */}
                <div className="flex gap-2">
                    <button onClick={() => applyScenario('conservative')} className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs font-medium text-slate-400 transition-hover hover:border-blue-500 hover:text-white">
                        Conservative
                    </button>
                    <button onClick={() => applyScenario('moderate')} className="flex-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-400 transition-hover hover:bg-blue-500/20">
                        Moderate
                    </button>
                    <button onClick={() => applyScenario('aggressive')} className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs font-medium text-slate-400 transition-hover hover:border-amber-500 hover:text-white">
                        Aggressive
                    </button>
                </div>

                {/* Node Config */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                    <div className="mb-6 flex items-center gap-2 text-blue-400">
                        <Server className="h-5 w-5" />
                        <h3 className="font-semibold text-slate-200">Node Configuration</h3>
                    </div>
                    <div className="space-y-6">
                        <InputRange label="pNodes Count" value={pNodes} min={1} max={50} step={1} onChange={setPNodes} icon={Server} />
                        <InputRange label="Storage Allocation" value={storage} min={100} max={10000} step={100} onChange={setStorage} icon={Database} unit="GB" />
                        <InputRange label="Performance Score" value={performance} min={0.1} max={1.0} step={0.05} onChange={setPerformance} icon={Activity} />
                        <InputRange label="Staked XAND" value={stake} min={0} max={50000} step={100} onChange={setStake} icon={Coins} unit="XAND" />
                        <InputRange label="Boost Multiplier" value={boost} min={1.0} max={5.0} step={0.1} onChange={setBoost} icon={TrendingUp} unit="x" />
                    </div>
                </div>

                {/* Network & Finance */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                    <div className="mb-6 flex items-center gap-2 text-purple-400">
                        <Database className="h-5 w-5" />
                        <h3 className="font-semibold text-slate-200">Network & Financials</h3>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-400">Total Network Credits</label>
                            <input type="number" value={totalNetworkCredits} onChange={(e) => setTotalNetworkCredits(Number(e.target.value))} className="w-full rounded bg-slate-950 border border-slate-800 px-2 py-1 text-sm text-slate-300" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-400">Total Epoch Fees</label>
                            <input type="number" value={totalFees} onChange={(e) => setTotalFees(Number(e.target.value))} className="w-full rounded bg-slate-950 border border-slate-800 px-2 py-1 text-sm text-slate-300" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-400">Investment Cost ($)</label>
                            <input type="number" value={investmentCost} onChange={(e) => setInvestmentCost(Number(e.target.value))} className="w-full rounded bg-slate-950 border border-slate-800 px-2 py-1 text-sm text-slate-300" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-400">STOINC Price ($)</label>
                            <input type="number" value={stoincPrice} step="0.01" onChange={(e) => setStoincPrice(Number(e.target.value))} className="w-full rounded bg-slate-950 border border-slate-800 px-2 py-1 text-sm text-slate-300" />
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: RESULTS */}
            <div className="space-y-6">

                {/* Main Reward Card */}
                <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-slate-900 p-8 shadow-2xl">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Coins size={120} />
                    </div>

                    <h2 className="mb-8 text-2xl font-bold text-white flex items-center gap-3">
                        <Calculator className="text-amber-400" />
                        Projected Returns
                    </h2>

                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <div className="text-sm text-slate-400 mb-1">Epoch Reward</div>
                            <div className="text-3xl font-mono font-bold text-white">
                                {stoincReward.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                <span className="text-sm text-amber-500 ml-1">STOINC</span>
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-slate-400 mb-1">Daily Income</div>
                            <div className="text-3xl font-mono font-bold text-emerald-400">
                                ${dailyIncome.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 border-t border-slate-700/50 pt-6">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm">Monthly Projection</span>
                            <span className="text-white font-mono font-medium">${(dailyIncome * 30).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm">Yearly Projection</span>
                            <span className="text-white font-mono font-medium">${(dailyIncome * 365).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                    </div>
                </div>

                {/* Investment Analysis */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                    <div className="mb-6 flex items-center gap-2 text-emerald-400">
                        <Clock className="h-5 w-5" />
                        <h3 className="font-semibold text-slate-200">Investment Analysis</h3>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-950/50 border border-slate-800">
                        <div>
                            <div className="text-sm text-slate-500 uppercase font-semibold">Break-even Period</div>
                            <div className="text-xs text-slate-600">Time to recover ${investmentCost}</div>
                        </div>
                        <div className={`text-2xl font-bold ${breakEvenDays < 365 ? 'text-emerald-400' : 'text-orange-400'}`}>
                            {breakEvenDays > 9000 ? '∞' : Math.ceil(breakEvenDays)} <span className="text-sm font-normal text-slate-500">days</span>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-slate-500 font-mono">
                        <div>
                            ROI (First Year): <span className="text-slate-300">{((dailyIncome * 365 / investmentCost) * 100).toFixed(1)}%</span>
                        </div>
                        <div>
                            Network Share: <span className="text-slate-300">{(networkShare * 100).toFixed(6)}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
