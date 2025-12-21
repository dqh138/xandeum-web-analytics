'use client';

import { useState, useEffect } from 'react';
import { Calculator, Coins, Server, Database, TrendingUp, Activity, Clock, Gem, Plus, Trash2, ChevronRight, ChevronDown } from 'lucide-react';

const NFT_BOOSTS = [
    { name: 'None', val: 1.0 },
    { name: 'Titan (1000%)', val: 11.0 },
    { name: 'Dragon (300%)', val: 4.0 },
    { name: 'Coyote (150%)', val: 2.5 },
    { name: 'Rabbit (50%)', val: 1.5 },
    { name: 'XENO (10%)', val: 1.1 },
    { name: 'Cricket (10%)', val: 1.1 },
];

const ERA_BOOSTS = [
    { name: 'None', val: 1.0 },
    { name: 'DeepSouth (1500%)', val: 16.0 },
    { name: 'South (900%)', val: 10.0 },
    { name: 'Main (600%)', val: 7.0 },
    { name: 'Coal (250%)', val: 3.5 },
    { name: 'Central (100%)', val: 2.0 },
    { name: 'North (25%)', val: 1.25 },
];

interface NodeConfig {
    id: number;
    storage: number;
    performance: number;
    stake: number;
    nfts: string[]; // Changed to store Names to avoid value collision
    era: number;
}

const InputNumber = ({ value, onChange, min, step, unit, className }: any) => (
    <div className={`relative ${className}`}>
        <input
            type="number"
            min={min}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white focus:border-blue-500 outline-none placeholder-slate-600"
        />
        {unit && <span className="absolute right-3 top-2.5 text-xs text-slate-500 pointer-events-none">{unit}</span>}
    </div>
);

export function StoincCalculator() {
    // Node Management
    const [nodes, setNodes] = useState<NodeConfig[]>([
        { id: 1, storage: 100, performance: 0.9, stake: 1000, nfts: [], era: 1.0 }
    ]);

    // Financial Inputs
    const [investmentCost, setInvestmentCost] = useState(2000); // $
    const [solPrice, setSolPrice] = useState(145); // $ (Approx SOL Price)
    const [xandPrice, setXandPrice] = useState(0.05); // $
    const [epochsPerDay, setEpochsPerDay] = useState(0.5);

    // Network Globals
    const [totalNetworkCredits, setTotalNetworkCredits] = useState(50000000);
    const [totalFees, setTotalFees] = useState(5000); // Total Fees in SOL
    const [pNodeShare, setPNodeShare] = useState(0.94); // 94%

    // Calculated Results
    const [storageCredits, setStorageCredits] = useState(0);
    const [avgBoost, setAvgBoost] = useState(1.0);
    const [myBoostedCredits, setMyBoostedCredits] = useState(0);

    const [stoincReward, setStoincReward] = useState(0);
    const [fixedXandReward, setFixedXandReward] = useState(0);
    const [dailyIncome, setDailyIncome] = useState(0);
    const [breakEvenDays, setBreakEvenDays] = useState(0);
    const [networkShare, setNetworkShare] = useState(0);

    // Node Operations
    const addNode = () => {
        const lastNode = nodes[nodes.length - 1];
        const newNode = lastNode
            ? { ...lastNode, id: lastNode.id + 1 }
            : { id: 1, storage: 100, performance: 0.9, stake: 1000, nfts: [], era: 1.0 };
        setNodes([...nodes, newNode]);
    };

    const removeNode = (id: number) => {
        if (nodes.length === 1) return;
        setNodes(nodes.filter(n => n.id !== id));
    };

    const updateNode = (id: number, field: keyof NodeConfig, value: any) => {
        setNodes(nodes.map(n => n.id === id ? { ...n, [field]: value } : n));
    };

    const toggleNodeNft = (id: number, name: string) => {
        const node = nodes.find(n => n.id === id);
        if (!node) return;

        let newNfts = [...node.nfts];
        if (name === 'None') {
            newNfts = [];
        } else {
            // Remove 'None' if present (though logic below handles it)
            if (newNfts.includes(name)) newNfts = newNfts.filter(v => v !== name);
            else newNfts.push(name);
        }
        updateNode(id, 'nfts', newNfts);
    };

    const applyScenario = (type: 'conservative' | 'moderate' | 'aggressive') => {
        // Only updates globals, keeps node configs
        switch (type) {
            case 'conservative':
                setNodes(prev => prev.map(n => ({ ...n, performance: 0.8 })));
                setTotalNetworkCredits(100000000);
                setTotalFees(1000);
                setSolPrice(120);
                setXandPrice(0.02);
                break;
            case 'moderate':
                setNodes(prev => prev.map(n => ({ ...n, performance: 0.95 })));
                setTotalNetworkCredits(50000000);
                setTotalFees(5000);
                setSolPrice(145);
                setXandPrice(0.05);
                break;
            case 'aggressive':
                setNodes(prev => prev.map(n => ({ ...n, performance: 1.0 })));
                setTotalNetworkCredits(20000000);
                setTotalFees(20000);
                setSolPrice(180);
                setXandPrice(0.15);
                break;
        }
    };

    useEffect(() => {
        // 1. Calculate Aggregates
        const pNodes = nodes.length;
        const totalStorage = nodes.reduce((acc, n) => acc + n.storage, 0);
        const totalStake = nodes.reduce((acc, n) => acc + n.stake, 0);
        const avgPerformance = nodes.reduce((acc, n) => acc + n.performance, 0) / pNodes;

        // 2. Storage Credits Formula
        // storageCredits = pNodes × storageSpace × performanceScore × stake
        const baseCredits = pNodes * totalStorage * avgPerformance * totalStake;
        setStorageCredits(baseCredits);

        // 3. Boost Factors (Geometric Mean)
        // boostedCredits = storageCredits × (boost₁ × boost₂ × ... × boostₙ)^(1/n)
        // Where n is number of nodes? Or number of boosts?
        // Example says: pNode 1 (1.5x), pNode 2 (1.0x), pNode 3 (2.0x) -> Geometric Mean of these 3.

        const nodeBoosts = nodes.map(n => {
            // Intra-node boosts: Multiplicative
            let nBoost = 1.0;

            // NFTs (Look up value by Name)
            n.nfts.forEach(nftName => {
                const nftObj = NFT_BOOSTS.find(b => b.name === nftName);
                if (nftObj) nBoost *= nftObj.val;
            });

            // Era
            if (n.era > 1.0) nBoost *= n.era;
            return nBoost;
        });

        // Geometric Mean
        let product = 1.0;
        nodeBoosts.forEach(b => product *= b);
        const geometricMean = Math.pow(product, 1 / pNodes);

        setAvgBoost(geometricMean);

        // 4. Final Calculation
        const finalBoostedCredits = baseCredits * geometricMean;
        setMyBoostedCredits(finalBoostedCredits);

        // 5. Network Share & Rewards
        const safeTotalCredits = Math.max(totalNetworkCredits, finalBoostedCredits, 1);
        const share = finalBoostedCredits / safeTotalCredits;
        setNetworkShare(share);

        // STOINC = totalFees x pNodeShare x (boostedCredits / totalBoostedCredits)
        const stoincPerEpoch = totalFees * pNodeShare * share;
        setStoincReward(stoincPerEpoch);

        const monthlyXand = 10000 * pNodes; // 10k XAND per pNode
        setFixedXandReward(monthlyXand);

        // Financials
        const dailyStoincIncome = stoincPerEpoch * epochsPerDay * solPrice;
        const dailyFixedIncome = (monthlyXand / 30) * xandPrice;
        const totalDaily = dailyStoincIncome + dailyFixedIncome;
        setDailyIncome(totalDaily);

        const days = totalDaily > 0 ? investmentCost / totalDaily : 99999;
        setBreakEvenDays(days);

    }, [nodes, totalNetworkCredits, totalFees, pNodeShare, epochsPerDay, investmentCost, solPrice, xandPrice]);



    return (
        <div className="grid gap-8 lg:grid-cols-12">
            {/* LEFT COLUMN: CONTROLS */}
            <div className="lg:col-span-7 space-y-8">
                {/* Scenarios */}
                <div className="flex gap-2">
                    <button onClick={() => applyScenario('conservative')} className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs font-medium text-slate-400 transition-hover hover:border-blue-500 hover:text-white">Conservative</button>
                    <button onClick={() => applyScenario('moderate')} className="flex-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-400 transition-hover hover:bg-blue-500/20">Moderate</button>
                    <button onClick={() => applyScenario('aggressive')} className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs font-medium text-slate-400 transition-hover hover:border-amber-500 hover:text-white">Aggressive</button>
                </div>

                {/* Nodes List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between text-blue-400 mb-2">
                        <div className="flex items-center gap-2">
                            <Server className="h-5 w-5" />
                            <h3 className="font-semibold text-slate-200">My pNodes ({nodes.length})</h3>
                        </div>
                        <button onClick={addNode} className="flex items-center gap-1 text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/30 transition-colors">
                            <Plus className="h-3 w-3" /> Add Node
                        </button>
                    </div>

                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {nodes.map((node, index) => (
                            <div key={node.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 backdrop-blur-sm relative group">
                                <div className="absolute right-4 top-4">
                                    <button onClick={() => removeNode(node.id)} disabled={nodes.length === 1} className="text-slate-600 hover:text-red-400 disabled:opacity-30 p-1">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                                <h4 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
                                    <span className="bg-slate-800 text-slate-400 w-6 h-6 rounded-full flex items-center justify-center text-xs">{index + 1}</span>
                                    Node #{node.id}
                                </h4>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-500">Storage (GB)</label>
                                        <InputNumber value={node.storage} min={0} step={100} onChange={(v: number) => updateNode(node.id, 'storage', v)} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-500">Staked XAND</label>
                                        <InputNumber value={node.stake} min={0} step={100} onChange={(v: number) => updateNode(node.id, 'stake', v)} />
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                                        <span>Performance</span>
                                        <span className="text-white">{node.performance}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={0.1}
                                        max={1.0}
                                        step={0.05}
                                        value={node.performance}
                                        onChange={(e) => updateNode(node.id, 'performance', Number(e.target.value))}
                                        className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-blue-500"
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-slate-500 mb-2 block">Era Boost</label>
                                        <select
                                            className="w-full text-xs bg-slate-950 border border-slate-800 rounded px-2 py-2 text-slate-300 outline-none focus:border-blue-500"
                                            value={node.era}
                                            onChange={(e) => updateNode(node.id, 'era', Number(e.target.value))}
                                        >
                                            {ERA_BOOSTS.map(b => <option key={b.name} value={b.val}>{b.name}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-slate-500 mb-2 block">NFT Boosts</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {NFT_BOOSTS.filter(n => n.name !== 'None').map((nft) => {
                                                const isSelected = node.nfts.includes(nft.name);
                                                return (
                                                    <button
                                                        key={nft.name}
                                                        onClick={() => toggleNodeNft(node.id, nft.name)}
                                                        className={`px-2 py-1 rounded text-[10px] border transition-all ${isSelected
                                                            ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                                                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                                                            }`}
                                                    >
                                                        {nft.name.split(' (')[0]} <span className="opacity-70">{nft.val}x</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Network & Finance Global Inputs */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                    <div className="mb-4 flex items-center gap-2 text-purple-400">
                        <TrendingUp className="h-5 w-5" />
                        <h3 className="font-semibold text-slate-200">Global Parameters</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">Network Credits</label>
                            <InputNumber value={totalNetworkCredits} onChange={setTotalNetworkCredits} min={0} step={1000000} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">Epoch Fees (SOL)</label>
                            <InputNumber value={totalFees} onChange={setTotalFees} min={0} step={100} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">pNode Share (%)</label>
                            <InputNumber value={pNodeShare * 100} onChange={(v: number) => setPNodeShare(v / 100)} min={0} max={100} step={1} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">SOL Price ($)</label>
                            <InputNumber value={solPrice} onChange={setSolPrice} step={0.1} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">XAND Price ($)</label>
                            <InputNumber value={xandPrice} onChange={setXandPrice} step={0.01} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">Invested ($)</label>
                            <InputNumber value={investmentCost} onChange={setInvestmentCost} step={100} />
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: RESULTS */}
            <div className="lg:col-span-5 space-y-6">
                <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-slate-900 p-8 shadow-2xl sticky top-8">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Coins size={120} />
                    </div>

                    <h2 className="mb-6 text-2xl font-bold text-white flex items-center gap-3">
                        <Calculator className="text-amber-400" />
                        Projected Returns
                    </h2>

                    <div className="space-y-6">
                        {/* Daily Income */}
                        <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/50">
                            <div className="text-sm text-slate-400 mb-1">Total Daily Income</div>
                            <div className="text-4xl font-mono font-bold text-emerald-400">
                                ${dailyIncome.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </div>
                            <div className="mt-2 flex justify-between text-xs text-slate-500">
                                <span>SOL: ${(stoincReward * epochsPerDay * solPrice).toFixed(2)}</span>
                                <span>XAND: ${((fixedXandReward / 30) * xandPrice).toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded bg-slate-950/30 border border-slate-800/50">
                                <div className="text-slate-500 mb-1">Raw Credits</div>
                                <div className="font-mono text-white font-medium">{storageCredits.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                            </div>
                            <div className="p-3 rounded bg-slate-950/30 border border-slate-800/50">
                                <div className="text-slate-500 mb-1">Avg Boost</div>
                                <div className="font-mono text-amber-400 font-medium">{avgBoost.toFixed(3)}x</div>
                            </div>
                            <div className="col-span-2 p-3 rounded bg-slate-950/30 border border-slate-800/50">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <div className="text-slate-500 mb-1">Boosted Total</div>
                                        <div className="font-mono text-blue-300 font-bold text-lg">{myBoostedCredits.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-slate-500 mb-1">Net Share</div>
                                        <div className="font-mono text-white">{(networkShare * 100).toFixed(6)}%</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 mt-6 border-t border-slate-700/50 pt-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Monthly Est.</span>
                            <span className="text-white font-mono font-medium">${(dailyIncome * 30).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Yearly Est.</span>
                            <span className="text-white font-mono font-medium text-lg">${(dailyIncome * 365).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Break-even</span>
                            <span className={`font-mono font-medium ${breakEvenDays < 365 ? 'text-emerald-400' : 'text-orange-400'}`}>
                                {breakEvenDays > 9999 ? '∞' : Math.ceil(breakEvenDays)} days
                            </span>
                        </div>
                    </div>
                </div>


            </div>
        </div>
    );
}
