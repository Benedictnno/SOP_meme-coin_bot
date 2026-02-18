import React from 'react';
import { Info } from 'lucide-react';

interface MetricsBarProps {
    isRunning: boolean;
    scannedTokens: number;
    validatedTokens: number;
    avgCompositeScore: number;
    highScoreAlerts: number;
    bestHour: number;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({
    isRunning,
    scannedTokens,
    validatedTokens,
    avgCompositeScore,
    highScoreAlerts,
    bestHour
}) => {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-6 border border-neutral-800 rounded bg-neutral-900/30 mb-8 divide-x divide-neutral-800">
            <div className="p-4 group relative cursor-pointer">
                <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1 flex items-center gap-1">
                    Status <Info className="w-2.5 h-2.5 opacity-50" />
                </div>
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-neutral-600'}`} />
                    <span className="text-xs font-semibold uppercase tracking-tight">{isRunning ? 'Active' : 'Standby'}</span>
                </div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    <div className="text-[9px] font-black uppercase tracking-widest text-purple-500 mb-1">Node Status</div>
                    <p className="text-[10px] text-neutral-400 leading-relaxed font-medium">Real-time connection status. Active means the system is currently monitoring the blockchain for new tokens.</p>
                </div>
            </div>

            <div className="p-4 group relative cursor-pointer">
                <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1 flex items-center gap-1">
                    Assets Scanned <Info className="w-2.5 h-2.5 opacity-50" />
                </div>
                <div className="text-lg font-semibold text-neutral-200 tabular-nums">{scannedTokens.toLocaleString()}</div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    <div className="text-[9px] font-black uppercase tracking-widest text-purple-500 mb-1">Total Discovery</div>
                    <p className="text-[10px] text-neutral-400 leading-relaxed font-medium">The total number of new token mints detected and processed by the scanners during this session.</p>
                </div>
            </div>

            <div className="p-4 group relative cursor-pointer">
                <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1 flex items-center gap-1">
                    Qualified <Info className="w-2.5 h-2.5 opacity-50" />
                </div>
                <div className="text-lg font-semibold text-neutral-200 tabular-nums">{validatedTokens.toLocaleString()}</div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    <div className="text-[9px] font-black uppercase tracking-widest text-purple-500 mb-1">Filtered Assets</div>
                    <p className="text-[10px] text-neutral-400 leading-relaxed font-medium">Tokens that passed your minimum filters and were subjected to deep security and AI analysis.</p>
                </div>
            </div>

            <div className="p-4 group relative cursor-pointer">
                <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1 flex items-center gap-1">
                    Avg Score <Info className="w-2.5 h-2.5 opacity-50" />
                </div>
                <div className={`text-lg font-semibold tabular-nums ${avgCompositeScore >= 70 ? 'text-green-500' : 'text-neutral-200'}`}>{avgCompositeScore}</div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    <div className="text-[9px] font-black uppercase tracking-widest text-purple-500 mb-1">Market Sentiment</div>
                    <p className="text-[10px] text-neutral-400 leading-relaxed font-medium">The aggregate security score across all qualified assets. A higher average indicates a lower-risk market environment.</p>
                </div>
            </div>

            <div className="p-4 group relative cursor-pointer">
                <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1 flex items-center gap-1">
                    High Signal <Info className="w-2.5 h-2.5 opacity-50" />
                </div>
                <div className="text-lg font-semibold text-neutral-200 tabular-nums">{highScoreAlerts}</div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    <div className="text-[9px] font-black uppercase tracking-widest text-purple-500 mb-1">Alpha Tier</div>
                    <p className="text-[10px] text-neutral-400 leading-relaxed font-medium">The number of tokens that achieved an Institutional Grade Alpha Score of 70 or higher.</p>
                </div>
            </div>

            <div className="p-4 group relative cursor-pointer">
                <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1 flex items-center gap-1">
                    Peak Hour <Info className="w-2.5 h-2.5 opacity-50" />
                </div>
                <div className="text-lg font-semibold text-neutral-200 tabular-nums">{bestHour.toString().padStart(2, '0')}:00</div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    <div className="text-[9px] font-black uppercase tracking-widest text-purple-500 mb-1">Peak Performance</div>
                    <p className="text-[10px] text-neutral-400 leading-relaxed font-medium">The 60-minute window with the highest average Alpha Score historically. This tells you when the most profitable launches usually occur.</p>
                </div>
            </div>
        </div>
    );
};
