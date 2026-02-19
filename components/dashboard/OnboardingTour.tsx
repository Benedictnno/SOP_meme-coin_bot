"use client"
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, CheckCircle, Zap, Search, Wallet, BarChart3, Bell, Send, Loader2, MessageCircle } from 'lucide-react';

interface TourStep {
    id: string;
    targetId?: string; // DOM element id to spotlight
    title: string;
    description: string;
    icon: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface OnboardingTourProps {
    onComplete: (telegramChatId: string) => Promise<void>;
    onSkip: () => void;
    existingTelegramId?: string;
}

const STEPS: TourStep[] = [
    {
        id: 'welcome',
        title: 'Welcome to SOP MemeScanner 👋',
        description: "You're now in the most advanced Solana meme coin intelligence platform. Let us give you a quick tour so you can start catching gems from day one.",
        icon: <Zap className="w-6 h-6 text-purple-400" />,
        position: 'center',
    },
    {
        id: 'feed',
        targetId: 'tour-feed',
        title: 'Terminal Feed',
        description: "This is your real-time signal feed. Every time the scanner detects a token that passes all validation checks — contract safety, whale activity, social signals — it appears here with a composite score. Click any signal to expand full analysis.",
        icon: <Bell className="w-6 h-6 text-purple-400" />,
        position: 'top',
    },
    {
        id: 'metrics',
        targetId: 'tour-metrics',
        title: 'Performance Metrics',
        description: "The stats bar at the top tracks your session. Scanned tokens, validated signals, high-score alerts, whale detections, and your average composite score — all updated in real time as the bot scans.",
        icon: <BarChart3 className="w-6 h-6 text-purple-400" />,
        position: 'bottom',
    },
    {
        id: 'scan-btn',
        targetId: 'tour-scan-btn',
        title: 'Start the Scanner',
        description: "Hit this button to kick off continuous scanning. The bot will poll DexScreener, run all validation layers (contract check, whale analysis, AI narrative scoring), and surface the best opportunities automatically.",
        icon: <Zap className="w-6 h-6 text-green-400" />,
        position: 'bottom',
    },
    {
        id: 'search',
        targetId: 'tour-search-link',
        title: 'Token Search',
        description: "Use the Search page to manually look up any Solana token by name or mint address. You'll get full security metrics plus an AI Agent you can chat with to analyze the token in depth.",
        icon: <Search className="w-6 h-6 text-purple-400" />,
        position: 'bottom',
    },
    {
        id: 'wallets',
        targetId: 'tour-wallets-link',
        title: 'Wallet Tracker',
        description: "The Wallets page lets you monitor any Solana wallet. Track known whale wallets or smart money addresses and get alerted when they make moves — a powerful edge for staying ahead of the market.",
        icon: <Wallet className="w-6 h-6 text-purple-400" />,
        position: 'bottom',
    },
    {
        id: 'telegram',
        title: 'Connect Telegram Alerts 🔔',
        description: "The final step! Connect your Telegram to receive instant alerts on your phone whenever a high-score signal is detected — even when you're not on the dashboard.",
        icon: <MessageCircle className="w-6 h-6 text-blue-400" />,
        position: 'center',
    },
];

function useElementRect(elementId?: string) {
    const [rect, setRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        if (!elementId) { setRect(null); return; }
        const update = () => {
            const el = document.getElementById(elementId);
            setRect(el ? el.getBoundingClientRect() : null);
        };
        update();
        window.addEventListener('resize', update);
        window.addEventListener('scroll', update, true);
        return () => {
            window.removeEventListener('resize', update);
            window.removeEventListener('scroll', update, true);
        };
    }, [elementId]);

    return rect;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete, onSkip, existingTelegramId }) => {
    const [stepIdx, setStepIdx] = useState(0);
    const [telegramId, setTelegramId] = useState(existingTelegramId || '');
    const [isSaving, setIsSaving] = useState(false);
    const [telegramError, setTelegramError] = useState('');
    const [telegramSaved, setTelegramSaved] = useState(!!existingTelegramId);

    const step = STEPS[stepIdx];
    const isFirst = stepIdx === 0;
    const isLast = stepIdx === STEPS.length - 1;
    const isCentered = !step.targetId || step.position === 'center';

    const rect = useElementRect(step.targetId);

    // Scroll target element into view
    useEffect(() => {
        if (step.targetId) {
            const el = document.getElementById(step.targetId);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [stepIdx, step.targetId]);

    const handleSaveTelegram = async () => {
        const trimmed = telegramId.trim();
        if (!trimmed) { setTelegramError('Please enter your Telegram Chat ID'); return; }
        if (isNaN(Number(trimmed))) { setTelegramError('Chat ID must be a number (e.g. 123456789)'); return; }
        setTelegramError('');
        setIsSaving(true);
        try {
            const res = await fetch('/api/user/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ telegramChatId: trimmed }),
            });
            if (!res.ok) throw new Error('Save failed');
            setTelegramSaved(true);
        } catch {
            setTelegramError('Failed to save. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleFinish = async () => {
        if (!telegramSaved) { setTelegramError('Please connect your Telegram first to finish setup.'); return; }
        await onComplete(telegramId);
    };

    // Compute spotlight and tooltip geometry
    const PAD = 12;
    const spotlightStyle = rect ? {
        top: rect.top - PAD,
        left: rect.left - PAD,
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
    } : null;

    // Tooltip placement
    const tooltipStyle: React.CSSProperties = {};
    if (isCentered || !rect) {
        tooltipStyle.top = '50%';
        tooltipStyle.left = '50%';
        tooltipStyle.transform = 'translate(-50%, -50%)';
    } else {
        const tooltipW = 380;
        const tooltipH = 280;
        const vpH = window.innerHeight;
        const vpW = window.innerWidth;

        const placeBelow = rect.bottom + tooltipH + PAD * 3 < vpH;
        const placeAbove = !placeBelow;

        if (placeBelow) {
            tooltipStyle.top = rect.bottom + PAD + 8;
        } else {
            tooltipStyle.top = rect.top - tooltipH - PAD - 8;
        }
        tooltipStyle.left = Math.min(
            Math.max(PAD, rect.left + rect.width / 2 - tooltipW / 2),
            vpW - tooltipW - PAD
        );
    }

    return (
        <div className="fixed inset-0 z-[9999] overflow-hidden" style={{ pointerEvents: 'all' }}>
            {/* Dark backdrop — NO blur so spotlight element stays crisp */}
            <div className="absolute inset-0 bg-black/10" />

            {/* Spotlight cutout */}
            {spotlightStyle && (
                <div
                    className="absolute rounded-xl ring-2 ring-purple-500/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.72)] transition-all duration-500"
                    style={spotlightStyle}
                />
            )}

            {/* Tooltip card */}
            <div
                className="absolute bg-[#0e0e12] border border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-900/50 w-[90vw] max-w-[400px] transition-all duration-300"
                style={tooltipStyle}
            >
                {/* Progress bar */}
                <div className="h-1 bg-neutral-800 rounded-t-2xl overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-500"
                        style={{ width: `${((stepIdx + 1) / STEPS.length) * 100}%` }}
                    />
                </div>

                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                                {step.icon}
                            </div>
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400/60 mb-0.5">
                                    Step {stepIdx + 1} of {STEPS.length}
                                </div>
                                <h3 className="text-base font-black text-white leading-tight">{step.title}</h3>
                            </div>
                        </div>
                        <button
                            onClick={onSkip}
                            className="p-1.5 rounded-full text-neutral-600 hover:text-neutral-400 hover:bg-white/5 transition-colors"
                            title="Skip tour"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Body */}
                    <p className="text-[13px] text-neutral-400 leading-relaxed mb-5">{step.description}</p>

                    {/* Telegram step extras */}
                    {step.id === 'telegram' && (
                        <div className="mb-5 space-y-3">
                            <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl text-[11px] text-blue-300 leading-relaxed">
                                <strong className="text-blue-400">How to get your Chat ID:</strong>
                                <ol className="mt-1.5 space-y-1 list-decimal list-inside text-blue-300/80">
                                    <li>Open Telegram and search <strong>@userinfobot</strong></li>
                                    <li>Send it any message</li>
                                    <li>It replies with your numeric Chat ID</li>
                                    <li>Paste it below 👇</li>
                                </ol>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={telegramId}
                                    onChange={e => { setTelegramId(e.target.value); setTelegramError(''); setTelegramSaved(false); }}
                                    placeholder="e.g. 123456789"
                                    className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-purple-500 transition-colors"
                                    disabled={isSaving}
                                />
                                <button
                                    onClick={handleSaveTelegram}
                                    disabled={isSaving || !telegramId.trim()}
                                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-500 disabled:opacity-50 transition-all flex items-center gap-1.5"
                                >
                                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                    Save
                                </button>
                            </div>
                            {telegramError && <p className="text-[11px] text-red-400">{telegramError}</p>}
                            {telegramSaved && (
                                <div className="flex items-center gap-2 text-[11px] text-green-400">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Telegram connected! You're all set for alerts.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setStepIdx(i => i - 1)}
                            disabled={isFirst}
                            className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold text-neutral-500 hover:text-neutral-300 disabled:opacity-0 transition-colors"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" /> Back
                        </button>

                        <div className="flex gap-1.5">
                            {STEPS.map((_, i) => (
                                <div
                                    key={i}
                                    className={`rounded-full transition-all duration-300 ${i === stepIdx ? 'w-4 h-1.5 bg-purple-500' : 'w-1.5 h-1.5 bg-neutral-700'}`}
                                />
                            ))}
                        </div>

                        {isLast ? (
                            <button
                                onClick={handleFinish}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${telegramSaved
                                    ? 'bg-purple-600 text-white hover:bg-purple-500'
                                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                                    }`}
                            >
                                <CheckCircle className="w-3.5 h-3.5" /> Finish
                            </button>
                        ) : (
                            <button
                                onClick={() => setStepIdx(i => i + 1)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-purple-500 transition-all"
                            >
                                Next <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
