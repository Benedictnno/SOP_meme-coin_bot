import React from 'react';
import { BarChart3 } from 'lucide-react';
import { EnhancedAlert } from '@/types';

interface AnalyticsViewProps {
    alerts: EnhancedAlert[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ alerts }) => {
    // Calculate score distribution
    const distribution = React.useMemo(() => {
        const counts = {
            elite: 0, // 90-100
            high: 0,  // 75-89
            medium: 0, // 50-74
            low: 0    // 0-49
        };

        alerts.forEach(alert => {
            if (alert.compositeScore >= 90) counts.elite++;
            else if (alert.compositeScore >= 75) counts.high++;
            else if (alert.compositeScore >= 50) counts.medium++;
            else counts.low++;
        });

        return counts;
    }, [alerts]);

    const maxCount = Math.max(...Object.values(distribution), 1);

    return (
        <div className="space-y-6">
            <div className="p-6 bg-purple-900/10 border border-purple-500/20 rounded-2xl">
                <div className="flex items-center gap-3 mb-2">
                    <BarChart3 className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-purple-100 italic">Neural Intelligence Brief</h3>
                </div>
                <p className="text-xs text-purple-300/70 leading-relaxed max-w-3xl">
                    Neural Insights visualize your signal distribution to show overall market health. It groups scanned tokens by quality score,
                    helping you distinguish high-conviction institutional-grade signals from common market noise.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="border border-neutral-800 rounded bg-neutral-900/30 overflow-hidden">
                    <div className="px-6 py-4 border-b border-neutral-800 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">Signal Distribution</div>

                    <div className="p-6 space-y-6">
                        {alerts.length === 0 ? (
                            <div className="text-center py-12 text-xs text-neutral-600 font-bold uppercase tracking-wider">
                                No signals validated yet.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {[
                                    { label: 'Elite (90+)', count: distribution.elite, color: 'bg-green-500' },
                                    { label: 'High (75-89)', count: distribution.high, color: 'bg-purple-500' },
                                    { label: 'Medium (50-74)', count: distribution.medium, color: 'bg-blue-500' },
                                    { label: 'Low (<50)', count: distribution.low, color: 'bg-neutral-600' },
                                ].map((item) => (
                                    <div key={item.label} className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                                            <span>{item.label}</span>
                                            <span className="text-white">{item.count}</span>
                                        </div>
                                        <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${item.color} transition-all duration-500 ease-out`}
                                                style={{ width: `${(item.count / maxCount) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="border border-neutral-800 rounded bg-neutral-900/30 overflow-hidden p-6 flex items-center justify-center">
                    <div className="text-center space-y-2">
                        <div className="text-4xl font-black text-white tabular-nums">{alerts.length}</div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">Total Validated Signals</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
