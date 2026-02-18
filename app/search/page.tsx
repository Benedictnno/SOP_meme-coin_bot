"use client"
import React, { useState, useEffect, Suspense } from 'react';
import { Search, Shield, TrendingUp, AlertTriangle, ExternalLink, RefreshCw, CheckCircle2, XCircle, Info, Zap, Skull, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { TokenChat, Message } from '@/components/dashboard/TokenChat';
import { TokenData } from '@/types';

function SearchContent() {
    const searchParams = useSearchParams();
    const urlQuery = searchParams.get('q');

    const [query, setQuery] = useState(urlQuery || '');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searched, setSearched] = useState(false);
    const [chatToken, setChatToken] = useState<TokenData | null>(null);
    const [chatHistories, setChatHistories] = useState<Record<string, Message[]>>({});

    useEffect(() => {
        if (urlQuery) {
            setQuery(urlQuery);
            performSearch(urlQuery);
        }
    }, [urlQuery]);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        performSearch(query);
    };

    const performSearch = async (searchQuery: string) => {
        if (!searchQuery.trim()) return;

        setLoading(true);
        setError('');
        setResults([]);
        setSearched(true);

        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();

            if (data.success) {
                setResults(data.results);
            } else {
                setError(data.error || 'Failed to search for tokens');
            }
        } catch (err) {
            setError('An error occurred while searching');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white font-['Inter']">
            {/* Header */}
            <div className="border-b border-white/5 bg-[#0d0d0f]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center space-x-3 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform font-bold text-xs ring-1 ring-white/20">SOP</div>
                        <span className="font-['Space_Grotesk'] font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">Master the Trench</span>
                    </Link>

                    <div className="flex items-center space-x-4">
                        <Link href="/dashboard" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Dashboard</Link>
                        <div className="h-4 w-[1px] bg-white/10"></div>
                        <div className="text-sm font-medium text-purple-400">Search</div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Hero Search Section */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl sm:text-5xl font-['Space_Grotesk'] font-bold mb-4 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                        Security First Search
                    </h1>
                    <p className="text-white/40 text-lg max-w-2xl mx-auto mb-10">
                        Scan any Solana token by name or address. Our 7-point validation engine runs a full security check in seconds.
                    </p>

                    <form onSubmit={handleSearch} className="max-w-3xl mx-auto relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-indigo-500/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                placeholder="Enter token name, symbol, or contract address..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full bg-[#121215] border border-white/10 rounded-2xl py-5 pl-14 pr-32 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-lg shadow-2xl"
                            />
                            <div className="absolute left-5 text-white/20 group-focus-within:text-purple-400 transition-colors">
                                <Search className="w-6 h-6" />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || !query.trim()}
                                className="absolute right-3 py-2.5 px-6 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold hover:shadow-lg hover:shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
                            >
                                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <span>Scan</span>}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Status Messages */}
                {loading && (
                    <div className="text-center py-20">
                        <div className="relative inline-block">
                            <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Shield className="w-6 h-6 text-purple-400 animate-pulse" />
                            </div>
                        </div>
                        <p className="mt-6 text-white/60 font-medium text-lg animate-pulse">Running SOP Security Engine...</p>
                        <p className="text-white/30 text-sm mt-2">Checking contract, liquidity, holders, and narrative signals</p>
                    </div>
                )}

                {error && (
                    <div className="max-w-2xl mx-auto bg-red-500/10 border border-red-500/20 p-6 rounded-2xl flex items-start space-x-4 mb-20 animate-in fade-in slide-in-from-top-4 duration-500">
                        <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
                        <div>
                            <h3 className="font-bold text-red-500">Search Error</h3>
                            <p className="text-red-500/80 text-sm mt-1">{error}</p>
                        </div>
                    </div>
                )}

                {/* Results Section */}
                {searched && !loading && results.length === 0 && !error && (
                    <div className="text-center py-20 bg-[#121215]/50 border border-dashed border-white/10 rounded-3xl">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Info className="w-8 h-8 text-white/20" />
                        </div>
                        <h3 className="text-white/60 font-bold text-xl">No tokens found</h3>
                        <p className="text-white/30 mt-2">Try a specific contract address for the most accurate results.</p>
                    </div>
                )}

                {results.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {results.map((alert, idx) => (
                            <div key={idx} className="group relative">
                                {/* Glowing background for high composite scores */}
                                {alert.compositeScore >= 80 && (
                                    <div className="absolute -inset-[1px] bg-gradient-to-r from-green-500/30 via-emerald-500/30 to-teal-500/30 rounded-3xl blur-md opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                )}

                                <div className="relative bg-[#121215] border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all flex flex-col h-full shadow-2xl">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-14 h-14 rounded-2xl bg-[#1d1d23] border border-white/10 flex items-center justify-center text-2xl shadow-inner">
                                                {alert.token.symbol[0]}
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold text-white group-hover:text-purple-400 transition-colors">{alert.token.name}</h3>
                                                <p className="text-white/40 font-mono text-sm flex items-center space-x-2">
                                                    <span>{alert.token.mint.slice(0, 4)}...{alert.token.mint.slice(-4)}</span>
                                                    <button onClick={() => navigator.clipboard.writeText(alert.token.mint)} className="hover:text-white transition-colors">
                                                        <ExternalLink className="w-3 h-3" />
                                                    </button>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-4xl font-bold ${alert.compositeScore >= 70 ? 'text-green-500' : alert.compositeScore >= 40 ? 'text-yellow-500' : 'text-red-500'}`}>
                                                {alert.compositeScore}<span className="text-lg opacity-40">/100</span>
                                            </div>
                                            <div className="text-[10px] uppercase tracking-widest text-white/30 font-bold mt-1">Alpha Score</div>
                                        </div>
                                    </div>

                                    {/* Score Grid */}
                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        <div className="bg-[#0d0d10] rounded-xl p-3 border border-white/5">
                                            <div className="text-white/30 text-[10px] uppercase font-bold mb-1">Liquidity</div>
                                            <div className="text-white font-bold">${(alert.token.liquidity / 1000).toFixed(1)}k</div>
                                        </div>
                                        <div className="bg-[#0d0d10] rounded-xl p-3 border border-white/5">
                                            <div className="text-white/30 text-[10px] uppercase font-bold mb-1">Market Cap</div>
                                            <div className="text-white font-bold">${(alert.token.marketCap / 1000).toFixed(0)}k</div>
                                        </div>
                                    </div>

                                    {/* Security Checklist */}
                                    <div className="space-y-3 mb-6 flex-grow">
                                        <h4 className="text-xs uppercase tracking-widest text-white/30 font-bold mb-3">Security Checklist</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {Object.entries(alert.checks).map(([key, value]) => (
                                                <div key={key} className={`flex items-center space-x-2 p-2 rounded-lg ${value ? 'bg-green-500/5 text-green-500/80 border border-green-500/10' : 'bg-red-500/5 text-red-500/80 border border-red-500/10'}`}>
                                                    {value ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                    <span className="text-xs font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Risks & Red Flags */}
                                    {alert.risks && alert.risks.length > 0 && (
                                        <div className="mb-6 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                                            <div className="flex items-center space-x-2 text-red-500 mb-2">
                                                <Skull className="w-4 h-4" />
                                                <span className="text-[10px] uppercase tracking-widest font-black">Red Flags Detected</span>
                                            </div>
                                            <ul className="space-y-1">
                                                {alert.risks.slice(0, 3).map((risk: string, i: number) => (
                                                    <li key={i} className="text-xs text-red-400/70 flex items-start space-x-2">
                                                        <span className="mt-1 w-1 h-1 bg-red-500/40 rounded-full shrink-0"></span>
                                                        <span>{risk}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* CTA Section */}
                                    <div className="flex items-center space-x-3 mt-auto">
                                        <button
                                            onClick={() => setChatToken(alert.token)}
                                            className="py-3 px-4 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-xl transition-all text-center text-sm font-bold flex items-center justify-center text-purple-400 hover:text-purple-300"
                                            title="Ask AI Agent"
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                        </button>
                                        <a href={`https://dexscreener.com/solana/${alert.token.mint}`} target="_blank" rel="noopener noreferrer" className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-center text-sm font-bold flex items-center justify-center space-x-2">
                                            <TrendingUp className="w-4 h-4" />
                                            <span>Chart</span>
                                        </a>
                                        <a href={`https://jup.ag/swap/SOL-${alert.token.mint}`} target="_blank" rel="noopener noreferrer" className="flex-[2] py-3 px-4 bg-gradient-to-br from-green-500 to-emerald-600 hover:shadow-lg hover:shadow-green-500/20 rounded-xl transition-all text-center text-sm font-bold flex items-center justify-center space-x-2">
                                            <Zap className="w-4 h-4" />
                                            <span>Buy Token</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Background Decorative Elements */}
            <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-blue-600/10 rounded-full blur-[100px]"></div>
            </div>
            {chatToken && (
                <TokenChat
                    token={chatToken}
                    isOpen={!!chatToken}
                    onClose={() => setChatToken(null)}
                    initialMessages={chatHistories[chatToken.mint] || []}
                    onUpdateMessages={(msgs) => setChatHistories(prev => ({ ...prev, [chatToken.mint]: msgs }))}
                />
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
                <RefreshCw className="w-10 h-10 animate-spin text-purple-500" />
            </div>
        }>
            <SearchContent />
        </Suspense>
    );
}
