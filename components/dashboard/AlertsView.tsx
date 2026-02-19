import React, { useState } from 'react';
import { Bell, ChevronRight, Zap, MessageSquare } from 'lucide-react';
import { EnhancedAlert, TokenData } from '@/types';
import { TokenChat, Message } from './TokenChat';

interface AlertsViewProps {
    alerts: EnhancedAlert[];
    selectedAlert: EnhancedAlert | null;
    setSelectedAlert: (alert: EnhancedAlert | null) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({ alerts, selectedAlert, setSelectedAlert }) => {
    const [chatToken, setChatToken] = useState<TokenData | null>(null);
    const [chatHistories, setChatHistories] = useState<Record<string, Message[]>>({});

    return (
        <div className="border border-neutral-800 rounded bg-neutral-900/30 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
                <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold tracking-tight uppercase">Terminal Feed</h2>
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                </div>
                <div className="text-[12px] font-bold text-neutral-500 uppercase tracking-widest">{alerts.length} signals identified</div>
            </div>

            {alerts.length === 0 ? (
                <div className="text-center py-32 flex flex-col items-center">
                    <div className="w-12 h-12 border border-neutral-800 rounded flex items-center justify-center mb-4 text-neutral-800"><Bell className="w-6 h-6" /></div>
                    <p className="text-xs text-neutral-600 font-bold uppercase tracking-[0.2em]">Inert state. Awaiting market volatility.</p>
                </div>
            ) : (
                <div className="divide-y divide-neutral-800/50 max-h-[800px] overflow-y-auto custom-scrollbar">
                    {alerts.map((alert: EnhancedAlert) => {
                        const isSelected = selectedAlert?.id === alert.id;
                        return (
                            <div key={alert.id} className="group border-l-2 border-transparent hover:border-purple-500 transition-all">
                                <div onClick={() => setSelectedAlert(isSelected ? null : alert)} className={`px-6 py-5 flex items-center gap-6 cursor-pointer hover:bg-neutral-900/50 ${isSelected ? 'bg-neutral-900' : ''}`}>
                                    <div className="w-12 flex flex-col items-center">
                                        <span className={`text-xl font-bold tracking-tighter tabular-nums ${alert.compositeScore >= 80 ? 'text-green-400' : alert.compositeScore >= 60 ? 'text-purple-400' : 'text-neutral-500'}`}>{alert.compositeScore}</span>
                                        <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-700 font-black">Score</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-sm font-bold text-neutral-100 tracking-tight">{alert.token.symbol}</h3>
                                            <span className="text-[8px] px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 text-neutral-500 rounded uppercase font-black tracking-widest">{alert.setupType}</span>
                                            {alert.whaleActivity.involved && <span className="flex items-center gap-1 text-[16px] text-purple-400 font-black uppercase tracking-widest">Whale Activity</span>}
                                        </div>
                                        <div className="flex items-center gap-4 text-[12px] text-neutral-600 font-bold uppercase tracking-widest">
                                            <span>{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                            <span className="font-mono lowercase opacity-50">{alert.token.mint.slice(0, 12)}...</span>
                                        </div>
                                    </div>
                                    <div className="hidden md:flex flex-col items-end gap-1">
                                        <div className="text-[13px] font-bold text-neutral-400 tabular-nums">${(alert.token.liquidity / 1000).toFixed(1)}K <span className="text-neutral-500">LIQ</span></div>
                                        <div className="text-[13px] font-bold text-green-500 tabular-nums">+{alert.token.volumeIncrease.toFixed(0)}% <span className="text-neutral-500 lowercase">spike</span></div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setChatToken(alert.token);
                                        }}
                                        className="p-2 hover:bg-purple-500/20 rounded-full text-neutral-500 hover:text-purple-400 transition-colors"
                                        title="Chat with AI Agent"
                                    >
                                        <MessageSquare className="w-5 h-5" />
                                    </button>
                                    <ChevronRight className={`w-4 h-4 text-neutral-800 transition-all ${isSelected ? 'rotate-90 text-purple-500' : ''}`} />
                                </div>

                                {isSelected && (
                                    <div className="px-8 pb-8 pt-4 bg-neutral-950/50 border-t border-neutral-900 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 text-neutral-400">
                                            <div className="space-y-4">
                                                <h4 className="text-[13px] font-black text-neutral-600 uppercase tracking-[0.3em] border-b border-neutral-800 pb-2">Analysis Vectors</h4>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between text-[14px]"><span className="text-neutral-500">Contract Safety</span><span className="font-bold text-neutral-300 tabular-nums">{alert.rugCheckScore}</span></div>
                                                    <div className="flex justify-between text-[14px]"><span className="text-neutral-500">Social Strength</span><span className="font-bold text-neutral-300 tabular-nums">{alert.socialSignals.overallScore}</span></div>
                                                    <div className="flex justify-between text-[14px]"><span className="text-neutral-500">Whale Conviction</span><span className="font-bold text-purple-400 tabular-nums">{Math.round(alert.whaleActivity.confidence * 100)}%</span></div>
                                                </div>
                                            </div>
                                            <div className="md:col-span-2 space-y-6">
                                                <div className="space-y-4">
                                                    <h4 className="text-[13px] font-black text-neutral-600 uppercase tracking-[0.3em] border-b border-neutral-800 pb-2">Intelligence Brief</h4>
                                                    <div className="space-y-3">
                                                        {alert.recommendations.map((rec: string, i: number) => (
                                                            <div key={i} className="flex gap-2 text-[16px] text-neutral-300 font-medium leading-relaxed">
                                                                <span className="text-purple-500 mt-0.5">•</span>
                                                                <span>{rec}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {alert.aiAnalysis && (
                                                    <div className="p-5 border border-purple-500/20 bg-purple-500/5 rounded-xl space-y-4 animate-in fade-in zoom-in-95 duration-500">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <Zap className="w-3.5 h-3.5 text-purple-400" />
                                                                <span className="text-[12px] font-black text-purple-400 uppercase tracking-widest">AI Agent Analysis</span>
                                                            </div>
                                                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[16px] font-black uppercase rounded tabular-nums">{alert.aiAnalysis.potential} potential</span>
                                                        </div>

                                                        <p className="text-[12px] text-purple-100 italic leading-relaxed">"{alert.aiAnalysis.summary}"</p>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-1">
                                                                <div className="text-[13px] font-bold text-neutral-500 uppercase">Narrative Depth</div>
                                                                <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-purple-500" style={{ width: `${alert.aiAnalysis.narrativeScore}%` }} />
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <div className="text-[13px] font-bold text-neutral-500 uppercase">Hype Momentum</div>
                                                                <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-blue-500" style={{ width: `${alert.aiAnalysis.hypeScore}%` }} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="pt-2">
                                                    <h4 className="text-[13px] font-black text-neutral-600 uppercase tracking-[0.3em] border-b border-neutral-800 pb-2 mb-3">Volume Interval Breakdown</h4>
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div>
                                                            <div className="text-[12px] text-neutral-500 uppercase font-bold mb-1">1 Hour</div>
                                                            <div className="text-xs font-bold text-neutral-300">${(alert.token.volume1h ? alert.token.volume1h / 1000 : 0).toFixed(1)}K</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[12px] text-neutral-500 uppercase font-bold mb-1">6 Hours</div>
                                                            <div className="text-xs font-bold text-neutral-300">${(alert.token.volume6h ? alert.token.volume6h / 1000 : 0).toFixed(1)}K</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[12px] text-neutral-500 uppercase font-bold mb-1">24 Hours</div>
                                                            <div className="text-xs font-bold text-neutral-300">${(alert.token.volume24h ? alert.token.volume24h / 1000 : 0).toFixed(1)}K</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[12px] text-neutral-500 uppercase font-bold mb-1">Total Proxy</div>
                                                            <div className="text-xs font-bold text-neutral-300">${(alert.token.volumeTotal ? alert.token.volumeTotal / 1000 : 0).toFixed(1)}K</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <h4 className="text-[13px] font-black text-neutral-600 uppercase tracking-[0.3em] border-b border-neutral-800 pb-2">Actions</h4>
                                                <div className="grid grid-cols-1 gap-2">
                                                    <a href={`https://jup.ag/swap/SOL-${alert.token.mint}`} target="_blank" className="flex items-center justify-center gap-2 py-2.5 bg-purple-600 text-white rounded text-[12px] font-black uppercase tracking-widest hover:bg-purple-500 transition-all">Jupiter</a>
                                                    <a href={`https://dexscreener.com/solana/${alert.token.mint}`} target="_blank" className="flex items-center justify-center gap-2 py-2.5 border border-neutral-800 text-neutral-400 rounded text-[12px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-all">Dexscreener</a>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setChatToken(alert.token);
                                                        }}
                                                        className="flex items-center justify-center gap-2 py-2.5 border border-purple-500/30 bg-purple-500/10 text-purple-400 rounded text-[12px] font-black uppercase tracking-widest hover:bg-purple-500/20 transition-all"
                                                    >
                                                        <MessageSquare className="w-3.5 h-3.5" /> Ask AI Agent
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
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
};
