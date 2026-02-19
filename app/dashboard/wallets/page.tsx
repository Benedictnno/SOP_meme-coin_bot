"use client"
import React, { useState, useEffect } from 'react';
import { Wallet, Plus, Trash2, History, TrendingUp, TrendingDown, ExternalLink, RefreshCw, Info, Activity, ArrowRightLeft } from 'lucide-react';
import Link from 'next/link';

export default function WalletsPage() {
    const [wallets, setWallets] = useState<any[]>([]);
    const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
    const [activity, setActivity] = useState<any[]>([]);
    const [loadingWallets, setLoadingWallets] = useState(true);
    const [loadingActivity, setLoadingActivity] = useState(false);
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
                if (selectedWallet === address) setSelectedWallet(null);
                fetchWallets();
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Sidebar: Wallet Management */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-[#121215] border border-white/10 rounded-3xl p-6 shadow-2xl">
                            <h2 className="text-xl font-['Space_Grotesk'] font-bold mb-6 flex items-center space-x-2">
                                <Wallet className="w-5 h-5 text-purple-400" />
                                <span>Tracked Wallets</span>
                            </h2>

                            <form onSubmit={handleAddWallet} className="space-y-3 mb-8">
                                <input
                                    type="text"
                                    placeholder="Solana Address"
                                    value={newWalletAddress}
                                    onChange={(e) => setNewWalletAddress(e.target.value)}
                                    className="w-full bg-[#0d0d10] border border-white/5 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                                />
                                <input
                                    type="text"
                                    placeholder="Label (e.g. Smart Money)"
                                    value={newWalletLabel}
                                    onChange={(e) => setNewWalletLabel(e.target.value)}
                                    className="w-full bg-[#0d0d10] border border-white/5 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                                />
                                <button
                                    type="submit"
                                    disabled={isAdding || !newWalletAddress.trim()}
                                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl font-bold flex items-center justify-center space-x-2 text-sm hover:shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50"
                                >
                                    {isAdding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> <span>Add Wallet</span></>}
                                </button>
                                {error && <p className="text-red-500 text-[10px] font-medium">{error}</p>}
                            </form>

                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                                {loadingWallets ? (
                                    <div className="py-10 text-center"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-white/20" /></div>
                                ) : wallets.length === 0 ? (
                                    <div className="py-10 text-center text-white/20 text-sm">No wallets tracked yet.</div>
                                ) : (
                                    wallets.map((w) => (
                                        <div
                                            key={w.address}
                                            onClick={() => setSelectedWallet(w.address)}
                                            className={`p-4 rounded-2xl border transition-all cursor-pointer group flex justify-between items-center ${selectedWallet === w.address ? 'bg-purple-500/10 border-purple-500/30' : 'bg-[#0d0d10] border-white/5 hover:border-white/10'}`}
                                        >
                                            <div className="min-w-0">
                                                <div className={`font-bold text-sm truncate ${selectedWallet === w.address ? 'text-purple-400' : 'text-white/80'}`}>{w.label}</div>
                                                <div className="text-[10px] text-white/30 font-mono truncate">{w.address}</div>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteWallet(w.address); }}
                                                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 rounded-lg text-red-500 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Main: Activity Feed */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-[#121215] border border-white/10 rounded-3xl p-8 min-h-[600px] shadow-2xl">
                            <div className="flex justify-between items-center mb-10">
                                <h2 className="text-2xl font-['Space_Grotesk'] font-bold flex items-center space-x-3">
                                    <History className="w-6 h-6 text-purple-400" />
                                    <span>Activity Feed</span>
                                </h2>
                                {selectedWallet && (
                                    <div className="px-4 py-1.5 bg-white/5 rounded-full border border-white/5 text-[10px] font-mono text-white/40">
                                        {selectedWallet.slice(0, 6)}...{selectedWallet.slice(-6)}
                                    </div>
                                )}
                            </div>

                            {!selectedWallet ? (
                                <div className="h-[400px] flex flex-col items-center justify-center text-center opacity-30">
                                    <Activity className="w-16 h-16 mb-4" />
                                    <h3 className="text-xl font-bold">Select a wallet to view activity</h3>
                                    <p className="text-sm mt-2 max-w-xs">Monitoring real-time swaps and running security validations on every token.</p>
                                </div>
                            ) : loadingActivity ? (
                                <div className="h-[400px] flex flex-col items-center justify-center">
                                    <RefreshCw className="w-10 h-10 animate-spin text-purple-500 mb-4" />
                                    <p className="text-white/40 animate-pulse">Fetching enriched transaction data...</p>
                                </div>
                            ) : activity.length === 0 ? (
                                <div className="h-[400px] flex flex-col items-center justify-center text-center opacity-20">
                                    <Info className="w-12 h-12 mb-4" />
                                    <h3 className="text-lg font-bold">No recent swaps detected</h3>
                                    <p className="text-xs mt-2">Activity will appear here when this wallet makes a trade.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {activity.map((item, idx) => (
                                        <div key={idx} className="relative pl-8 before:absolute before:left-[11px] before:top-8 before:bottom-[-24px] before:w-[2px] before:bg-white/5 last:before:hidden">
                                            <div className="absolute left-0 top-1.5 w-[24px] h-[24px] rounded-full bg-[#1d1d23] border border-white/10 flex items-center justify-center z-10">
                                                {item.type === 'buy' ? <TrendingUp className="w-3 h-3 text-green-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
                                            </div>

                                            <div className="bg-[#1d1d23]/50 border border-white/5 rounded-2xl p-6 hover:bg-[#1d1d23] transition-all">
                                                <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                                                    <div>
                                                        <div className="flex items-center space-x-2">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${item.type === 'buy' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                                                {item.type}
                                                            </span>
                                                            <span className="text-white font-bold">{item.tokenSymbol === 'UNKNOWN' ? (item.tokenMint?.slice(0, 4) || 'TOKEN') : item.tokenSymbol}</span>
                                                            <span className="text-white/20 text-xs">•</span>
                                                            <span className="text-white/30 text-xs">{new Date(item.timestamp).toLocaleTimeString()}</span>
                                                        </div>
                                                        <div className="text-lg font-['Space_Grotesk'] font-bold mt-1">
                                                            {item.type === 'buy' ? '+' : '-'}{(item.tokenAmount || 0).toLocaleString()} {item.tokenSymbol === 'UNKNOWN' ? '' : item.tokenSymbol}
                                                            <span className="text-white/20 text-sm ml-2">(${(item.solAmount || 0).toFixed(2)} SOL)</span>
                                                        </div>
                                                    </div>
                                                    <a href={`https://solscan.io/tx/${item.signature}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all">
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                </div>

                                                {item.validation ? (
                                                    <div className="mt-4 p-4 bg-[#0d0d10] border border-white/5 rounded-xl flex items-center justify-between group/val">
                                                        <div className="flex items-center space-x-4">
                                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${item.validation.compositeScore >= 70 ? 'bg-green-500/20 text-green-500' : item.validation.compositeScore >= 40 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'}`}>
                                                                {item.validation.compositeScore}
                                                            </div>
                                                            <div>
                                                                <div className="text-xs font-bold text-white/60">SOP Security Engine</div>
                                                                <div className="text-[10px] text-white/30 truncate max-w-[200px]">{item.validation.recommendations[0]}</div>
                                                            </div>
                                                        </div>
                                                        <Link href={`/dashboard/search?q=${item.tokenMint}`} className="text-[10px] font-bold text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-widest flex items-center space-x-1">
                                                            <span>Full Report</span>
                                                            <ArrowRightLeft className="w-2 h-2" />
                                                        </Link>
                                                    </div>
                                                ) : (
                                                    <div className="mt-4 p-3 bg-white/[0.02] border border-dashed border-white/5 rounded-xl text-center text-[10px] text-white/20">
                                                        Validation data not available for this transaction
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Background Decorative Elements */}
            <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-indigo-600/5 rounded-full blur-[100px]"></div>
            </div>
        </>
    );
}
