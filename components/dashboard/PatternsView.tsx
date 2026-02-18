import React from 'react';
import { RefreshCw } from 'lucide-react';
import { EnhancedAlert } from '@/types';

interface PatternsViewProps {
    alerts: EnhancedAlert[];
}

export const PatternsView: React.FC<PatternsViewProps> = ({ alerts }) => {
    // Calculate hourly distribution of activity
    const hourlyData = React.useMemo(() => {
        const hours = Array(24).fill(0);

        alerts.forEach(alert => {
            const date = new Date(alert.timestamp);
            const hour = date.getHours();
            hours[hour]++;
        });

        return hours; // array of counts per hour 0-23
    }, [alerts]);

    const maxActivity = Math.max(...hourlyData, 1);
    const currentHour = new Date().getHours();

    return (
        <div className="space-y-6">
            <div className="p-6 bg-blue-900/10 border border-blue-500/20 rounded-2xl">
                <div className="flex items-center gap-3 mb-2">
                    <RefreshCw className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-blue-100 italic">Network Cycle Analysis</h3>
                </div>
                <p className="text-xs text-blue-300/70 leading-relaxed max-w-3xl">
                    Tracks network volatility waves and liquidity clusters. Meme coin launches often happen in waves;
                    this analysis detects repeating patterns in on-chain activity to predict the next surge of high-potential launches.
                </p>
            </div>

            <div className="border border-neutral-800 rounded bg-neutral-900/30 overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-800 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">Network Volatility Cycles (24h)</div>

                <div className="p-8">
                    {alerts.length === 0 ? (
                        <div className="text-center py-12 text-xs text-neutral-600 font-bold uppercase tracking-wider">
                            Awaiting sufficient data points for cycle analysis.
                        </div>
                    ) : (
                        <div className="h-64 flex items-end justify-between gap-1 overflow-x-auto pb-4">
                            {hourlyData.map((count, hour) => {
                                const isCurrent = hour === currentHour;
                                const heightPercentage = (count / maxActivity) * 100;

                                return (
                                    <div key={hour} className="flex-1 min-w-[20px] group flex flex-col items-center gap-2 h-full justify-end">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] text-white font-bold mb-1 absolute -mt-6 bg-neutral-900 px-2 py-1 rounded border border-neutral-800 pointer-events-none z-10">
                                            {count} Signals
                                        </div>
                                        <div
                                            className={`w-full rounded-t-sm transition-all duration-300 hover:opacity-100 ${isCurrent ? 'bg-blue-500 opacity-90' : 'bg-neutral-800 opacity-60 hover:bg-neutral-700'}`}
                                            style={{ height: `${Math.max(heightPercentage, 2)}%` }} // min height for visibility
                                        />
                                        <div className={`text-[8px] font-mono ${isCurrent ? 'text-blue-400 font-bold' : 'text-neutral-600'}`}>
                                            {hour.toString().padStart(2, '0')}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
