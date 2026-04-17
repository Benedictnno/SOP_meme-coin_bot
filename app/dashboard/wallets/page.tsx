"use client"
import React, { useState, useEffect } from 'react';
import { Wallet, Plus, Trash2, History, TrendingUp, TrendingDown, ExternalLink, RefreshCw, Info, Activity, ArrowRightLeft, Shield, Crown, Target, LayoutGrid, List } from 'lucide-react';
import Link from 'next/link';

interface WalletStats {
    realizedPnL: number;
    totalInvested: number;
    winRate: number;
    openPositionsCount: number;
    bestToken: { symbol: string, pnl: number } | null;
}

interface PortfolioItem {
    mint: string;
    symbol: string;
    amount: number;
    invested: number;
    avgEntry: number;
    lastUpdated: string;
}

export default function WalletsPage() {
    const [wallets, setWallets] = useState<any[]>([]);
    const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
    const [activity, setActivity] = useState<any[]>([]);
    const [stats, setStats] = useState<WalletStats | null>(null);
    const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
    const [loadingWallets, setLoadingWallets] = useState(true);
    const [loadingActivity, setLoadingActivity] = useState(false);
    const [loadingStats, setLoadingStats] = useState(false);
    const [activeTab, setActiveTab] = useState<'activity' | 'portfolio'>('activity');
    
    // Form state
    const [newWalletAddress, setNewWalletAddress] = useState('');
    const [newWalletLabel, setNewWalletLabel] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchWallets();
    }, []);

    useEffect(() => {
        if (selectedWallet) {
            fetchActivity(selectedWallet);
            fetchStats(selectedWallet);
        }
    }, [selectedWallet]);

    const fetchWallets = async () => {
        setLoadingWallets(true);
        try {
            const res = await fetch('/api/wallets');
            const data = await res.json();
            if (data.success) {
                setWallets(data.wallets);
                if (data.wallets.length > 0 && !selectedWallet) {
                    setSelectedWallet(data.wallets[0].address);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingWallets(false);
        }
    };

    const fetchActivity = async (address: string) => {
        setLoadingActivity(true);
        setActivity([]);
        try {
            const res = await fetch(`/api/wallets/${address}/activity`);
            const data = await res.json();
            if (data.success) {
                setActivity(data.activity);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingActivity(false);
        }
    };

    const fetchStats = async (address: string) => {
        setLoadingStats(true);
        try {
            const res = await fetch(`/api/wallets/${address}/stats`);
            const data = await res.json();
            if (data.success) {
                setStats(data.summary);
                setPortfolio(data.portfolio);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingStats(false);
        }
    };

    const handleAddWallet = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWalletAddress.trim()) return;

        setIsAdding(true);
        setError('');
        try {
            const res = await fetch('/api/wallets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: newWalletAddress, label: newWalletLabel })
            });
            const data = await res.json();
            if (data.success) {
                setNewWalletAddress('');
                setNewWalletLabel('');
                fetchWallets();
            } else {
                setError(data.error || 'Failed to add wallet');
            }
        } catch (err) {
            setError('An error occurred');
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteWallet = async (address: string) => {
        if (!confirm('Are you sure you want to stop tracking this wallet?')) return;

        try {
            const res = await fetch(`/api/wallets?address=${address}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                if (selectedWallet === address) {
                    setSelectedWallet(null);
                    setStats(null);
                    setPortfolio([]);
                }
                fetchWallets();
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505]">
            <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* ── LEFT SIDEBAR: WALLET LIST ─────────────────────────── */}
                    <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-24">
                        <div className="bg-[#0d0d0f] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                            <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-neutral-400 flex items-center gap-2">
                                    <Target className="w-3.5 h-3.5 text-purple-500" />
                                    Intel Tracking
                                </h2>
                                <span className="text-[10px] font-bold text-white/20 uppercase tabular-nums">{wallets.length} active</span>
                            </div>

                            <div className="p-4 space-y-4">
                                <form onSubmit={handleAddWallet} className="space-y-2">
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            placeholder="Solana Address..."
                                            value={newWalletAddress}
                                            onChange={(e) => setNewWalletAddress(e.target.value)}
                                            className="w-full bg-black border border-white/5 rounded-xl py-3 px-4 text-xs font-medium placeholder:text-neutral-700 outline-none focus:border-purple-500/50 focus:bg-purple-500/5 transition-all"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Label (Optional)"
                                            value={newWalletLabel}
                                            onChange={(e) => setNewWalletLabel(e.target.value)}
                                            className="flex-1 bg-black border border-white/5 rounded-xl py-3 px-4 text-xs font-medium placeholder:text-neutral-700 outline-none focus:border-purple-500/50 transition-all"
                                        />
                                        <button
                                            type="submit"
                                            disabled={isAdding || !newWalletAddress.trim()}
                                            className="w-12 h-12 bg-purple-600 hover:bg-purple-500 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:grayscale transition-all shadow-lg shadow-purple-600/10"
                                        >
                                            {isAdding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {error && <p className="text-red-500/80 text-[10px] font-bold uppercase tracking-wider text-center pt-1">{error}</p>}
                                </form>

                                <div className="space-y-1.5 max-h-[500px] overflow-y-auto custom-scrollbar no-scrollbar">
                                    {loadingWallets ? (
                                        <div className="py-12 text-center opacity-20"><RefreshCw className="w-6 h-6 animate-spin mx-auto" /></div>
                                    ) : wallets.length === 0 ? (
                                        <div className="py-12 text-center">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600">No Target Profiles</p>
                                        </div>
                                    ) : (
                                        wallets.map((w) => (
                                            <div
                                                key={w.address}
                                                onClick={() => setSelectedWallet(w.address)}
                                                className={`p-3.5 rounded-xl border transition-all cursor-pointer group flex items-center gap-4 ${selectedWallet === w.address 
                                                    ? 'bg-purple-500/10 border-purple-500/20' 
                                                    : 'bg-black/40 border-white/5 hover:border-white/10 hover:bg-white/[0.02]'}`}
                                            >
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-black text-xs ${selectedWallet === w.address ? 'bg-purple-500 text-white' : 'bg-neutral-900 text-neutral-600'}`}>
                                                    {w.performance?.winRate ? `${Math.round(w.performance.winRate)}%` : w.label?.[0]?.toUpperCase() || 'W'}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                        <div className={`font-bold text-xs truncate ${selectedWallet === w.address ? 'text-white' : 'text-neutral-400'}`}>
                                                            {w.performance?.nickname || w.label}
                                                        </div>
                                                        {w.performance && <Crown className="w-3 h-3 text-amber-500 shrink-0" />}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-[9px] text-white/20 font-mono truncate tracking-tight">{w.address.slice(0, 4)}...{w.address.slice(-4)}</div>
                                                        {w.performance?.avgReturn > 0 && (
                                                            <span className="text-[8px] font-black text-green-500/70">+{Math.round(w.performance.avgReturn)}% avg</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteWallet(w.address); }}
                                                    className="opacity-0 group-hover:opacity-100 p-2 text-neutral-600 hover:text-red-500 transition-all ml-auto"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT MAIN: INSIGHTS & ACTIVITY ─────────────────── */}
                    <div className="lg:col-span-9 space-y-8">
                        
                        {/* 1. PERFORMANCE MATRIX (HUD) */}
                        {selectedWallet && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="bg-[#0d0d0f] border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                                    <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Realized PnL</div>
                                    <div className={`text-2xl font-black tabular-nums tracking-tighter ${(stats?.realizedPnL || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {(stats?.realizedPnL || 0) >= 0 ? '+' : ''}{stats?.realizedPnL?.toFixed(2) || '0.00'} <span className="text-xs text-neutral-600">SOL</span>
                                    </div>
                                    <div className="mt-2 text-[9px] font-bold text-neutral-600 uppercase">Across {stats?.winRate ? Math.round((stats.winRate / 100) * (activity.length || 10)) : 0} successful swaps</div>
                                </div>

                                <div className="bg-[#0d0d0f] border border-white/5 p-6 rounded-2xl relative group">
                                    <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Alpha Win-Rate</div>
                                    <div className="text-2xl font-black tabular-nums tracking-tighter text-white">
                                        {stats?.winRate?.toFixed(1) || '0.0'}%
                                    </div>
                                    <div className="mt-2 flex gap-1">
                                        {Array.from({ length: 10 }).map((_, i) => (
                                            <div key={i} className={`h-1 flex-1 rounded-full ${i < (stats?.winRate || 0) / 10 ? 'bg-purple-500' : 'bg-neutral-800'}`} />
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-[#0d0d0f] border border-white/5 p-6 rounded-2xl">
                                    <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Open Exposure</div>
                                    <div className="text-2xl font-black tabular-nums tracking-tighter text-neutral-400">
                                        {stats?.openPositionsCount || 0} <span className="text-xs">Trades</span>
                                    </div>
                                    <div className="mt-2 text-[9px] font-bold text-neutral-600 uppercase flex items-center gap-1">
                                        <Activity className="w-2.5 h-2.5" /> Live Monitoring Active
                                    </div>
                                </div>

                                <div className="bg-[#0d0d0f] border border-white/5 p-6 rounded-2xl group overflow-hidden">
                                     <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                                        <Target className="w-20 h-20" />
                                    </div>
                                    <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2 text-center md:text-left">Best Capture</div>
                                    <div className="text-2xl font-black tabular-nums tracking-tighter text-amber-500 text-center md:text-left">
                                        {stats?.bestToken?.symbol || 'N/A'}
                                    </div>
                                    <div className="mt-2 text-[9px] font-bold text-neutral-600 uppercase text-center md:text-left">
                                        Max Profit: {stats?.bestToken?.pnl?.toFixed(2) || '0.00'} SOL
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. ACTIVITY & PORTFOLIO TABS */}
                        <div className="bg-[#0d0d0f] border border-white/5 rounded-3xl overflow-hidden shadow-2xl shadow-purple-900/5 min-h-[600px]">
                            <div className="p-8 border-b border-white/5 bg-white/[0.01] flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-8">
                                    <button 
                                        onClick={() => setActiveTab('activity')}
                                        className={`flex items-center gap-2.5 pb-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === 'activity' ? 'text-purple-500' : 'text-neutral-500 hover:text-neutral-300'}`}
                                    >
                                        <List className="w-3.5 h-3.5" />
                                        Activity Feed
                                        {activeTab === 'activity' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.4)]" />}
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('portfolio')}
                                        className={`flex items-center gap-2.5 pb-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === 'portfolio' ? 'text-purple-500' : 'text-neutral-500 hover:text-neutral-300'}`}
                                    >
                                        <LayoutGrid className="w-3.5 h-3.5" />
                                        Neural Portfolio
                                        {activeTab === 'portfolio' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.4)]" />}
                                    </button>
                                </div>
                                
                                {selectedWallet && (
                                    <div className="flex items-center gap-3">
                                        <div className="px-3 py-1.5 bg-black border border-white/10 rounded-lg text-[9px] font-mono text-neutral-500 select-all hover:border-white/20 transition-colors">
                                            {selectedWallet}
                                        </div>
                                        <a href={`https://solscan.io/account/${selectedWallet}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-white/5 text-neutral-600 hover:text-white rounded-lg transition-all">
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    </div>
                                )}
                            </div>

                            <div className="p-8">
                                {!selectedWallet ? (
                                    <div className="h-[400px] flex flex-col items-center justify-center text-center">
                                        <div className="w-16 h-16 rounded-3xl bg-neutral-900 flex items-center justify-center mb-6 text-neutral-700 border border-white/5">
                                            <Shield className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-sm font-black uppercase tracking-widest text-neutral-400">Initialize Target Selection</h3>
                                        <p className="text-[10px] text-neutral-600 mt-2 max-w-[240px] leading-relaxed font-bold uppercase tracking-tight">Select a whale profile from the sidebar to visualize their network activity and PnL performance.</p>
                                    </div>
                                ) : activeTab === 'activity' ? (
                                    /* ACTIVITY LIST */
                                    <div className="space-y-6">
                                        {loadingActivity ? (
                                            <div className="h-[300px] flex flex-col items-center justify-center">
                                                <RefreshCw className="w-10 h-10 animate-spin text-purple-600/40" />
                                            </div>
                                        ) : activity.length === 0 ? (
                                            <div className="py-20 text-center opacity-30 text-xs font-bold uppercase tracking-widest">No Recent Signals Found</div>
                                        ) : (
                                            activity.map((item, idx) => (
                                                <div key={idx} className="group relative pl-10 animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                                                    {/* Timeline element */}
                                                    <div className="absolute left-3 top-2 w-0.5 h-[calc(100%+24px)] bg-neutral-900 group-last:bg-transparent" />
                                                    <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-[#0d0d0f] flex items-center justify-center z-10 ${item.type === 'buy' ? 'bg-green-500' : 'bg-red-500'}`}>
                                                        {item.type === 'buy' ? <TrendingUp className="w-2 h-2 text-black" /> : <TrendingDown className="w-2 h-2 text-black" />}
                                                    </div>

                                                    <div className="bg-black/40 border border-white/5 rounded-2xl p-5 hover:border-purple-500/20 hover:bg-purple-500/[0.02] transition-all">
                                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                            <div>
                                                                <div className="flex items-center gap-3 mb-2">
                                                                    <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${item.type === 'buy' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                                                        {item.type}
                                                                    </div>
                                                                    <div className="text-white font-black text-sm">{item.tokenSymbol === 'UNKNOWN' ? 'Unidentified Asset' : item.tokenSymbol}</div>
                                                                    <div className="text-[10px] text-neutral-600 font-bold tabular-nums">{new Date(item.timestamp).toLocaleTimeString()}</div>
                                                                </div>
                                                                <div className="text-lg font-black tracking-tight tabular-nums">
                                                                    {item.type === 'buy' ? '+' : '-'}{item.tokenAmount?.toLocaleString()} <span className="text-xs text-neutral-500 font-medium">{item.tokenSymbol === 'UNKNOWN' ? '' : item.tokenSymbol}</span>
                                                                    <span className="ml-3 text-xs text-neutral-600 font-bold uppercase tracking-tight opacity-60">Value: {item.solAmount?.toFixed(3)} SOL</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <a href={`https://solscan.io/tx/${item.signature}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-900 text-neutral-600 hover:text-white hover:bg-neutral-800 transition-all border border-white/5">
                                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                                </a>
                                                            </div>
                                                        </div>

                                                        {item.validation && (
                                                            <div className="mt-4 p-4 bg-[#050505] border border-white/5 rounded-xl flex items-center justify-between">
                                                                <div className="flex items-center gap-4">
                                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-xs border ${item.validation.compositeScore >= 70 ? 'bg-green-500/10 border-green-500/30 text-green-500' : item.validation.compositeScore >= 40 ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
                                                                        {item.validation.compositeScore}
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-[9px] font-black text-neutral-500 uppercase tracking-widest leading-none mb-1">Security Score</div>
                                                                        <div className="text-[10px] text-neutral-400 truncate max-w-[300px] font-bold italic">"{item.validation.recommendations[0]}"</div>
                                                                    </div>
                                                                </div>
                                                                <Link href={`/dashboard/search?q=${item.tokenMint}`} className="text-[9px] font-black text-purple-400 hover:text-purple-300 uppercase tracking-widest flex items-center gap-1.5 transition-colors">
                                                                    Full Analysis <ArrowRightLeft className="w-2 h-2" />
                                                                </Link>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                ) : (
                                    /* PORTFOLIO LIST */
                                    <div className="space-y-4">
                                        {loadingStats ? (
                                            <div className="h-[300px] flex flex-col items-center justify-center">
                                                <RefreshCw className="w-10 h-10 animate-spin text-purple-600/40" />
                                            </div>
                                        ) : portfolio.length === 0 ? (
                                            <div className="py-20 text-center opacity-30 text-xs font-bold uppercase tracking-widest">No Active Positions Detected</div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {portfolio.map((pos, idx) => (
                                                    <div key={idx} className="p-5 bg-black/40 border border-white/5 rounded-2xl hover:border-purple-500/30 transition-all animate-in fade-in zoom-in-95" style={{ animationDelay: `${idx * 50}ms` }}>
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div>
                                                                <div className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-1">Active Holdings</div>
                                                                <h4 className="text-xl font-black tracking-tighter">{pos.symbol}</h4>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-1 text-center sm:text-right">Avg Entry</div>
                                                                <div className="font-bold tabular-nums text-xs font-mono text-neutral-400">${pos.avgEntry?.toFixed(8)}</div>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                                            <div>
                                                                <div className="text-[8px] font-black text-neutral-600 uppercase mb-1">Accumulated</div>
                                                                <div className="text-xs font-bold text-white tabular-nums">{pos.amount.toLocaleString()} <span className="text-[10px] text-neutral-500">{pos.symbol}</span></div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-[8px] font-black text-neutral-600 uppercase mb-1 text-center sm:text-right text-right sm:text-right">SOL Invested</div>
                                                                <div className="text-xs font-bold text-white tabular-nums">{pos.invested?.toFixed(3)} SOL</div>
                                                            </div>
                                                        </div>
                                                        <Link href={`/dashboard/search?q=${pos.mint}`} className="mt-4 w-full py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-xl border border-white/5 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest text-neutral-400 hover:text-white transition-all">
                                                            <Activity className="w-3 h-3" /> Monitor Position
                                                        </Link>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Background Decorative HUD Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-600/[0.03] blur-[140px] rounded-full translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/[0.02] blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2" />
                <div className="absolute top-1/2 left-1/2 w-full h-full border-[1px] border-white/[0.01] rounded-full -translate-x-1/2 -translate-y-1/2 scale-150" />
            </div>
        </div>
    );
}
