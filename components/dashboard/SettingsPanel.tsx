import React from 'react';
import { Settings, Zap, Loader2, Save } from 'lucide-react';
import { BotSettings } from '@/types';

interface SettingsPanelProps {
    settings: BotSettings;
    setSettings: (settings: BotSettings) => void;
    telegramChatId: string;
    setTelegramChatId: (id: string) => void;
    onSaveSettings: (settings?: BotSettings) => void;
    isSaving: boolean;
    saveSuccess: boolean;
    onTestTelegram: () => void;
    subscriptionInfo: { expiry: string | null; trialDaysLeft: number };
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
    settings,
    setSettings,
    telegramChatId,
    setTelegramChatId,
    onSaveSettings,
    isSaving,
    onTestTelegram,
    subscriptionInfo
}) => {
    return (
        <div className="border border-neutral-800 rounded bg-neutral-900/80 backdrop-blur-3xl shadow-2xl overflow-hidden mb-12 max-w-4xl mx-auto animate-in zoom-in-95 duration-300">
            <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4 text-purple-500" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-400">System Nucleus</h3>
                </div>
            </div>
            <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                    <div>
                        <label className="block text-[12px] font-black text-neutral-600 uppercase tracking-[0.3em] mb-3">Min Liquidity (Safe Cash) $</label>
                        <input
                            type="number"
                            value={settings.minLiquidity}
                            onChange={e => setSettings({ ...settings, minLiquidity: Number(e.target.value) })}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-3 text-sm text-neutral-200 focus:border-purple-500/50 outline-none transition-all tabular-nums font-bold"
                        />
                    </div>
                    <div>
                        <label className="block text-[12px] font-black text-neutral-600 uppercase tracking-[0.3em] mb-3">Min Volume Spike (Hype) %</label>
                        <input
                            type="number"
                            value={settings.minVolumeIncrease}
                            onChange={e => setSettings({ ...settings, minVolumeIncrease: Number(e.target.value) })}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-3 text-sm text-neutral-200 focus:border-purple-500/50 outline-none transition-all tabular-nums font-bold"
                        />
                    </div>
                    <div>
                        <label className="block text-[12px] font-black text-neutral-600 uppercase tracking-[0.3em] mb-3">Max Top Holder (Fairness) %</label>
                        <input
                            type="number"
                            value={settings.maxTopHolderPercent}
                            onChange={e => setSettings({ ...settings, maxTopHolderPercent: Number(e.target.value) })}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-3 text-sm text-neutral-200 focus:border-purple-500/50 outline-none transition-all tabular-nums font-bold"
                        />
                        <p className="text-[8px] text-neutral-500 mt-2 uppercase font-bold">Max % one person can own (Standard: 10%)</p>
                    </div>
                </div>
                <div className="space-y-8">
                    <div>
                        <label className="block text-[12px] font-black text-neutral-600 uppercase tracking-[0.3em] mb-3">Quality Filter (Score 0-100)</label>
                        <input
                            type="number"
                            value={settings.minCompositeScore || 0}
                            onChange={e => setSettings({ ...settings, minCompositeScore: Number(e.target.value) })}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-3 text-sm text-neutral-200 focus:border-purple-500/50 outline-none transition-all tabular-nums font-bold"
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-neutral-950 border border-neutral-800 rounded">
                            <span className="text-[12px] font-black uppercase tracking-[0.2em] text-neutral-400">Only Whale Activity</span>
                            <button
                                onClick={() => setSettings({ ...settings, whaleOnly: !settings.whaleOnly })}
                                className={`w-10 h-5 rounded-full relative transition-all ${settings.whaleOnly ? 'bg-purple-600' : 'bg-neutral-800'}`}
                            >
                                <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-all ${settings.whaleOnly ? 'translate-x-5' : ''}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-neutral-950 border border-neutral-800 rounded">
                            <span className="text-[12px] font-black uppercase tracking-[0.2em] text-neutral-400">Telegram Notifications</span>
                            <button
                                onClick={() => setSettings({ ...settings, enableTelegramAlerts: !settings.enableTelegramAlerts })}
                                className={`w-10 h-5 rounded-full relative transition-all ${settings.enableTelegramAlerts ? 'bg-purple-600' : 'bg-neutral-800'}`}
                            >
                                <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-all ${settings.enableTelegramAlerts ? 'translate-x-5' : ''}`} />
                            </button>
                        </div>
                        <div>
                            <label className="block text-[12px] font-black text-neutral-600 uppercase tracking-[0.3em] mb-2">Telegram Chat ID</label>
                            <input
                                type="text"
                                value={telegramChatId}
                                onChange={e => setTelegramChatId(e.target.value)}
                                placeholder="e.g. 12345678"
                                className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-3 text-sm text-neutral-200 focus:border-purple-500/50 outline-none transition-all tabular-nums font-bold"
                            />
                            <p className="text-[12px] text-neutral-500 mt-2 uppercase font-bold leading-relaxed">
                                Required for private pings. <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline underline-offset-2">Click here to get your ID from @userinfobot</a>
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[12px] font-black text-neutral-600 uppercase tracking-[0.3em] mb-3">AI Engine Personality</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['conservative', 'balanced', 'aggressive'].map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => setSettings({ ...settings, aiMode: mode as any })}
                                    className={`py-2 rounded text-[12px] font-black uppercase tracking-widest border transition-all ${settings.aiMode === mode ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : 'bg-neutral-950 border-neutral-900 text-neutral-600'}`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Subscription Box */}
            <div className="mx-10 mb-10 p-6 bg-purple-900/10 border border-purple-500/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                        <Zap className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Subscription Tier</div>
                        <div className="text-sm font-bold text-neutral-200">
                            {subscriptionInfo.expiry ? `Premium Member (Expires: ${new Date(subscriptionInfo.expiry).toLocaleDateString()})` : `Free Trial (${subscriptionInfo.trialDaysLeft} days remaining)`}
                        </div>
                    </div>
                </div>
                {!subscriptionInfo.expiry && (
                    <a href="/subscribe" className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-[10px] font-black uppercase tracking-widest text-white rounded transition-all">Upgrade Now</a>
                )}
            </div>

            <div className="px-10 py-6 border-t border-neutral-800 bg-neutral-950/50 flex items-center justify-between">
                <button onClick={onTestTelegram} className="text-[12px] font-black uppercase tracking-[0.2em] text-neutral-500 hover:text-purple-400 transition-all">Verify Bot Connection</button>
                <button
                    onClick={() => onSaveSettings(settings)}
                    disabled={isSaving}
                    className="px-10 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-purple-600/20 flex items-center gap-2"
                >
                    {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    {isSaving ? 'Syncing...' : 'Lock Parameters'}
                </button>
            </div>
        </div>
    );
};
