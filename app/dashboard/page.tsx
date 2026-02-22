"use client"
import React, { useState, useEffect } from 'react';
import { EnhancedAlert, BotSettings } from '@/types';
import { useSession } from 'next-auth/react';
import { Activity, BarChart3, RefreshCw, Loader2, Play, Pause, Settings, X, Clock, Lock, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { MetricsBar } from '@/components/dashboard/MetricsBar';
import { SettingsPanel } from '@/components/dashboard/SettingsPanel';
import { AlertsView } from '@/components/dashboard/AlertsView';
import { AnalyticsView } from '@/components/dashboard/AnalyticsView';
import { PatternsView } from '@/components/dashboard/PatternsView';

interface PerformanceMetrics {
  totalAlerts: number;
  validAlerts: number;
  avgCompositeScore: number;
  highScoreAlerts: number;
  bestHour: number;
  worstHour: number;
  whaleSuccessRate: number;
}

export default function EnhancedAnalyticsDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isRunning, setIsRunning] = useState(false);
  const [alerts, setAlerts] = useState<EnhancedAlert[]>([]);
  const [scannedTokens, setScannedTokens] = useState(0);
  const [validatedTokens, setValidatedTokens] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<EnhancedAlert | null>(null);
  const [activeView, setActiveView] = useState<'alerts' | 'analytics' | 'patterns'>('alerts');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<{ expiry: string | null; trialDaysLeft: number }>({ expiry: null, trialDaysLeft: 0 });
  const [telegramChatId, setTelegramChatId] = useState('');
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);

  const [settings, setSettings] = useState<BotSettings>({
    minLiquidity: 50000,
    maxTopHolderPercent: 10,
    minVolumeIncrease: 200,
    scanInterval: 60,
    enableTelegramAlerts: false,
    minCompositeScore: 50,
    minSocialScore: 30, // Ensure no duplicates, TS might complain if strict
    whaleOnly: false,
    aiMode: 'balanced'
  });

  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    totalAlerts: 0,
    validAlerts: 0,
    avgCompositeScore: 0,
    highScoreAlerts: 0,
    bestHour: 14,
    worstHour: 3,
    whaleSuccessRate: 0
  });



  // Load from API
  useEffect(() => {
    const loadUserData = async () => {
      if (status !== 'authenticated') return;

      try {
        const res = await fetch('/api/user/settings');
        const data = await res.json();
        if (data.success) {
          if (data.settings) setSettings(data.settings);
          if (data.telegramChatId) setTelegramChatId(data.telegramChatId);

          // If trial was denied (IP abuse), redirect to subscribe immediately
          if (data.trialDenied) {
            router.push('/subscribe');
            return;
          }

          // Calculate trial
          const createdAt = new Date(data.createdAt);
          const trialExpiry = new Date(createdAt.getTime() + 21 * 24 * 60 * 60 * 1000);
          const trialDaysLeft = Math.max(0, Math.ceil((trialExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

          // Show paywall banner if trial has expired and no paid subscription
          const hasActiveSub = data.subscriptionExpiresAt && new Date(data.subscriptionExpiresAt) > new Date();
          if (trialDaysLeft === 0 && !hasActiveSub) {
            setSubscriptionExpired(true);
          }

          setSubscriptionInfo({
            expiry: data.subscriptionExpiresAt || null,
            trialDaysLeft
          });
        }

        const stored = window.localStorage.getItem('enhanced-alerts');
        if (stored) {
          const localData = JSON.parse(stored);
          setAlerts(localData.alerts || []);
          setScannedTokens(localData.scannedTokens || 0);
          setValidatedTokens(localData.validatedTokens || 0);
          calculateMetrics(localData.alerts || []);
        }
      } catch (err) {
        console.error('Failed to load user data:', err);
      }
    };
    loadUserData();
  }, [status]);

  // Save alerts to local storage
  useEffect(() => {
    if (alerts.length > 0) {
      window.localStorage.setItem('enhanced-alerts', JSON.stringify({
        alerts: alerts.slice(0, 100),
        scannedTokens,
        validatedTokens
      }));
      calculateMetrics(alerts);
    }
  }, [alerts, scannedTokens, validatedTokens]);

  const onSaveSettings = async (targetSettings = settings) => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: targetSettings,
          telegramChatId
        }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const calculateMetrics = (alertList: EnhancedAlert[]) => {
    if (alertList.length === 0) return;

    const metrics: PerformanceMetrics = {
      totalAlerts: alertList.length,
      validAlerts: alertList.filter(a => a.isValid).length,
      avgCompositeScore: Math.round(
        alertList.reduce((sum, a) => sum + a.compositeScore, 0) / alertList.length
      ),
      highScoreAlerts: alertList.filter(a => a.compositeScore >= 70).length,
      bestHour: 14,
      worstHour: 3,
      whaleSuccessRate: 0
    };

    const hourlyScores: { [key: number]: number[] } = {};
    alertList.forEach(alert => {
      const hour = new Date(alert.timestamp).getHours();
      if (!hourlyScores[hour]) hourlyScores[hour] = [];
      hourlyScores[hour].push(alert.compositeScore);
    });

    let bestScore = 0;
    let worstScore = 100;
    Object.entries(hourlyScores).forEach(([hour, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg > bestScore) {
        bestScore = avg;
        metrics.bestHour = parseInt(hour);
      }
      if (avg < worstScore) {
        worstScore = avg;
        metrics.worstHour = parseInt(hour);
      }
    });

    const whaleAlerts = alertList.filter(a => a.whaleActivity.involved);
    if (whaleAlerts.length > 0) {
      const whaleHighScore = whaleAlerts.filter(a => a.compositeScore >= 70).length;
      metrics.whaleSuccessRate = Math.round((whaleHighScore / whaleAlerts.length) * 100);
    }

    setPerformanceMetrics(metrics);
  };

  const runScan = async () => {
    if (isScanning) return;
    setIsScanning(true);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (data.success) {
        setScannedTokens(prev => prev + data.scanned);
        setValidatedTokens(prev => prev + data.valid);

        setAlerts(prev => {
          const alertMap = new Map(prev.map(a => [a.token.mint, a]));
          data.alerts.forEach((newAlert: EnhancedAlert) => {
            alertMap.set(newAlert.token.mint, newAlert);
          });
          return Array.from(alertMap.values())
            .sort((a, b) => b.compositeScore - a.compositeScore)
            .slice(0, 100);
        });

        setLastScanTime(new Date());
      } else {
        if (data.error === 'subscription_required') {
          setSubscriptionExpired(true);
          setIsRunning(false);
        }
        console.error('Scan API error:', data.error);
      }
    } catch (error) {
      console.error('Failed to run scan:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const fetchSignals = async () => {
    try {
      const response = await fetch('/api/signals');
      const data = await response.json();
      if (data.success && data.alerts) {
        setAlerts(prev => {
          const alertMap = new Map(prev.map(a => [a.token.mint, a]));
          data.alerts.forEach((newAlert: EnhancedAlert) => {
            alertMap.set(newAlert.token.mint, newAlert);
          });
          return Array.from(alertMap.values())
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 100);
        });

        // Update counts based on historical data
        const totalValid = data.alerts.filter((a: any) => a.isValid).length;
        setValidatedTokens(prev => Math.max(prev, totalValid));
        setScannedTokens(prev => Math.max(prev, data.alerts.length));
      }
    } catch (error) {
      console.error('Failed to fetch signals:', error);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'authenticated') {
      fetchSignals(); // Initial fetch
      interval = setInterval(fetchSignals, 30000); // Poll every 30s as fallback for Pusher
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      runScan();
      interval = setInterval(runScan, settings.scanInterval * 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, settings.scanInterval]);

  const onTestTelegram = async () => {
    try {
      const res = await fetch('/api/test-telegram', { method: 'POST' });
      const data = await res.json();
      if (data.success) alert('Test alert sent to your Telegram!');
      else alert('Failed to send test alert. Check your Bot Token and Chat ID.');
    } catch (err) {
      alert('Error connecting to Telegram API.');
    }
  };

  return (
    <>
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-900/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-900/10 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 py-8">

        {/* ── Paywall Banner (expired users) ─────────────────────────────── */}
        {subscriptionExpired && (
          <div className="relative mb-6 rounded-2xl overflow-hidden border border-amber-500/30 bg-gradient-to-r from-amber-950/60 via-orange-950/40 to-amber-950/60">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(245,158,11,0.15),transparent_70%)]" />
            <div className="relative flex flex-wrap items-center justify-between gap-4 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-400 mb-0.5">Free Trial Ended</div>
                  <p className="text-[13px] text-amber-200/80">
                    The scanner is still running and catching signals — but your access is locked.
                    <span className="text-amber-300 font-bold"> You're missing live opportunities right now.</span>
                  </p>
                </div>
              </div>
              <a
                href="/subscribe"
                className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-black rounded-full font-black text-[11px] uppercase tracking-widest hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/30 animate-pulse"
              >
                <Zap className="w-3.5 h-3.5" /> Unlock Now
              </a>
            </div>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black tracking-tighter uppercase italic">
              SOP <span className="text-purple-500">Sniper</span>
            </h1>
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-green-500/10 border border-green-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Sniper Operational</span>
            </div>
            {lastScanTime && (
              <span className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest flex items-center gap-1">
                <Clock className="w-3 h-3" /> {lastScanTime.toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              id="tour-scan-btn"
              onClick={() => setIsRunning(!isRunning)}
              className={`px-6 py-2.5 rounded-full flex items-center gap-2 transition-all font-black text-[10px] uppercase tracking-[0.2em] shadow-xl ${isRunning
                ? 'bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20'
                : 'bg-purple-600 text-white hover:bg-purple-500 shadow-purple-600/20'
                }`}
            >
              {isRunning ? <><Pause className="w-4 h-4 fill-current" /> Stop Scan</> : <><Play className="w-4 h-4 fill-current" /> Deep Scan</>}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-10 h-10 flex items-center justify-center rounded-full border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 transition-all"
            >
              <Settings className={`w-5 h-5 ${showSettings ? 'rotate-90 text-purple-500' : ''} transition-all`} />
            </button>
            <button
              onClick={() => { window.localStorage.removeItem('enhanced-alerts'); setAlerts([]); }}
              className="w-10 h-10 flex items-center justify-center rounded-full border border-neutral-800 text-neutral-400 hover:text-red-500 transition-all"
              title="Clear All Data"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-8 mb-8 border-b border-neutral-800/50">
          {[
            { id: 'alerts', label: 'Signal Feed', icon: Activity },
            { id: 'analytics', label: 'Neural Insights', icon: BarChart3 },
            { id: 'patterns', label: 'Network Cycles', icon: RefreshCw }
          ].map(view => (
            <button key={view.id} onClick={() => setActiveView(view.id as any)} className={`pb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative ${activeView === view.id ? 'text-purple-500' : 'text-neutral-600 hover:text-neutral-400'}`}>
              <view.icon className="w-4 h-4" />
              {view.label}
              {activeView === view.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />}
            </button>
          ))}
        </div>

        {showSettings && (
          <SettingsPanel
            settings={settings}
            setSettings={setSettings}
            telegramChatId={telegramChatId}
            setTelegramChatId={setTelegramChatId}
            onSaveSettings={onSaveSettings}
            isSaving={isSaving}
            saveSuccess={saveSuccess}
            onTestTelegram={onTestTelegram}
            subscriptionInfo={subscriptionInfo}
          />
        )}

        {/* Metrics Bar */}
        <div id="tour-metrics">
          <MetricsBar
            isRunning={isRunning}
            scannedTokens={scannedTokens}
            validatedTokens={validatedTokens}
            avgCompositeScore={performanceMetrics.avgCompositeScore}
            highScoreAlerts={performanceMetrics.highScoreAlerts}
            bestHour={performanceMetrics.bestHour}
          />
        </div>

        {isScanning && (
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4 mb-6 animate-pulse">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 animate-spin text-purple-400" />
              <div className="flex-1">
                <div className="font-semibold text-purple-100 italic">Deep Analysis Engine Active...</div>
                <div className="text-xs text-purple-400 font-bold uppercase tracking-widest">Validating Narrative & Security</div>
              </div>
            </div>
          </div>
        )}

        {/* View Selection */}
        {activeView === 'alerts' && (
          <div id="tour-feed">
            {subscriptionExpired ? (
              /* ── Locked ghost cards (behavioral decay) ── */
              <div className="space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-widest text-amber-500/70 flex items-center gap-2 mb-4">
                  <Lock className="w-3.5 h-3.5" />
                  {alerts.length > 0 ? `${alerts.length} signal${alerts.length !== 1 ? 's' : ''} locked — upgrade to unlock` : '3 live signals detected — upgrade to view'}
                </div>
                {[
                  { score: '92', checks: '7/7', liq: '$180k', spike: '847%', label: '💎 DIAMOND' },
                  { score: '78', checks: '6/7', liq: '$94k', spike: '412%', label: '🟡 HIGH' },
                  { score: '71', checks: '6/7', liq: '$61k', spike: '318%', label: '🟡 HIGH' },
                ].map((ghost, i) => (
                  <div key={i} className="relative rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 overflow-hidden select-none">
                    {/* Blur overlay */}
                    <div className="absolute inset-0 backdrop-blur-[6px] bg-black/40 z-10 flex items-center justify-center rounded-xl">
                      <a href="/subscribe" className="flex items-center gap-2 px-4 py-2 bg-amber-500/90 text-black rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-amber-400 transition-all">
                        <Lock className="w-3.5 h-3.5" /> Subscribe to View
                      </a>
                    </div>
                    {/* Ghost content underneath */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-neutral-700" />
                        <div>
                          <div className="w-20 h-3 bg-neutral-700 rounded mb-1" />
                          <div className="w-14 h-2.5 bg-neutral-800 rounded" />
                        </div>
                      </div>
                      <span className="text-[11px] font-black text-purple-400">α {ghost.score}/100 {ghost.label}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px] text-neutral-600">
                      <div>✅ Checks: {ghost.checks}</div>
                      <div>💰 {ghost.liq}</div>
                      <div>📈 +{ghost.spike}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <AlertsView
                alerts={alerts}
                selectedAlert={selectedAlert}
                setSelectedAlert={setSelectedAlert}
              />
            )}
          </div>
        )}

        {activeView === 'analytics' && (
          <AnalyticsView
            alerts={alerts}
          />
        )}

        {activeView === 'patterns' && (
          <PatternsView
            alerts={alerts}
          />
        )}
      </div>
    </>
  );
}