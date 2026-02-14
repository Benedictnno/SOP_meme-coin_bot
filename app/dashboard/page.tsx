"use client"
import React, { useState, useEffect } from 'react';
import { TokenData, EnhancedAlert, BotSettings, ValidationChecks } from '@/types';
import { Bell, Play, Pause, Settings, Download, X, TrendingUp, Activity, CheckCircle, XCircle, DollarSign, Users, Zap, ExternalLink, RefreshCw, BarChart3, PieChart, Clock, Target, Shield, Twitter, AlertTriangle, ChevronRight, Star, Save, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

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

  const [settings, setSettings] = useState<BotSettings>({
    minLiquidity: 50000,
    maxTopHolderPercent: 10,
    minVolumeIncrease: 200,
    scanInterval: 60,
    enableTelegramAlerts: false,
    minCompositeScore: 50,
    minSocialScore: 30,
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

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

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

          // Calculate trial
          const createdAt = new Date(data.createdAt);
          const trialExpiry = new Date(createdAt.getTime() + 21 * 24 * 60 * 60 * 1000);
          const trialDaysLeft = Math.max(0, Math.ceil((trialExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

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
        if (data.error === 'Subscription expired') {
          setIsRunning(false);
          alert(data.message);
        }
        console.error('Scan API error:', data.error);
      }
    } catch (error) {
      console.error('Failed to run scan:', error);
    } finally {
      setIsScanning(false);
    }
  };

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
    <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-900/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-900/10 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 py-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Zap className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase italic leading-none mb-1">MemeScanner <span className="text-purple-500">v3.0</span></h1>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">Neural Intelligence Terminal</span>
                {lastScanTime && (
                  <span className="text-[10px] text-neutral-700 font-bold uppercase tracking-widest flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Sync: {lastScanTime.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => setIsRunning(!isRunning)} className={`px-8 py-3 rounded-full flex items-center gap-3 transition-all font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl ${isRunning ? 'bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20' : 'bg-purple-600 text-white hover:bg-purple-500 shadow-purple-600/20'}`}>
              {isRunning ? <><Pause className="w-4 h-4 fill-current" /> Terminate Node</> : <><Play className="w-4 h-4 fill-current" /> Initialize Node</>}
            </button>
            <button onClick={() => setShowSettings(!showSettings)} className="w-12 h-12 flex items-center justify-center rounded-full border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 transition-all">
              <Settings className={`w-5 h-5 ${showSettings ? 'rotate-90 text-purple-500' : ''} transition-all`} />
            </button>
            <button onClick={() => { window.localStorage.removeItem('enhanced-alerts'); setAlerts([]); }} className="w-12 h-12 flex items-center justify-center rounded-full border border-neutral-800 text-neutral-400 hover:text-red-500 transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

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
        <div className="grid grid-cols-2 lg:grid-cols-6 border border-neutral-800 rounded bg-neutral-900/30 mb-8 divide-x divide-neutral-800 overflow-hidden">
          <div className="p-4">
            <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1">Status</div>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-neutral-600'}`} />
              <span className="text-xs font-semibold uppercase tracking-tight">{isRunning ? 'Active' : 'Standby'}</span>
            </div>
          </div>
          <div className="p-4"><div className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1">Assets Scanned</div><div className="text-lg font-semibold text-neutral-200 tabular-nums">{scannedTokens.toLocaleString()}</div></div>
          <div className="p-4"><div className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1">Qualified</div><div className="text-lg font-semibold text-neutral-200 tabular-nums">{validatedTokens.toLocaleString()}</div></div>
          <div className="p-4"><div className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1">Avg Score</div><div className={`text-lg font-semibold tabular-nums ${performanceMetrics.avgCompositeScore >= 70 ? 'text-green-500' : 'text-neutral-200'}`}>{performanceMetrics.avgCompositeScore}</div></div>
          <div className="p-4"><div className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1">High Signal</div><div className="text-lg font-semibold text-neutral-200 tabular-nums">{performanceMetrics.highScoreAlerts}</div></div>
          <div className="p-4"><div className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1">Peak Hour</div><div className="text-lg font-semibold text-neutral-200 tabular-nums">{performanceMetrics.bestHour.toString().padStart(2, '0')}:00</div></div>
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
        {activeView === 'alerts' && <AlertsView alerts={alerts} selectedAlert={selectedAlert} setSelectedAlert={setSelectedAlert} />}
        {activeView === 'analytics' && <AnalyticsView alerts={alerts} performanceMetrics={performanceMetrics} scoreDistribution={{}} />}
        {activeView === 'patterns' && <PatternsView hourlyDistribution={{}} performanceMetrics={performanceMetrics} />}
      </div>
    </div>
  );
}

const AlertsView = ({ alerts, selectedAlert, setSelectedAlert }: any) => (
  <div className="border border-neutral-800 rounded bg-neutral-900/30 overflow-hidden">
    <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-bold tracking-tight uppercase">Terminal Feed</h2>
        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
      </div>
      <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{alerts.length} signals identified</div>
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
                  <span className="text-[8px] uppercase tracking-[0.3em] text-neutral-700 font-black">Score</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-sm font-bold text-neutral-100 tracking-tight">{alert.token.symbol}</h3>
                    <span className="text-[9px] px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 text-neutral-500 rounded uppercase font-black tracking-widest">{alert.setupType}</span>
                    {alert.whaleActivity.involved && <span className="flex items-center gap-1 text-[9px] text-purple-400 font-black uppercase tracking-widest">Whale Activity</span>}
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-neutral-600 font-bold uppercase tracking-widest">
                    <span>{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    <span className="font-mono lowercase opacity-50">{alert.token.mint.slice(0, 12)}...</span>
                  </div>
                </div>
                <div className="hidden md:flex flex-col items-end gap-1">
                  <div className="text-[10px] font-bold text-neutral-400 tabular-nums">${(alert.token.liquidity / 1000).toFixed(1)}K <span className="text-neutral-600">LIQ</span></div>
                  <div className="text-[10px] font-bold text-green-500 tabular-nums">+{alert.token.volumeIncrease.toFixed(0)}% <span className="text-neutral-600 lowercase">spike</span></div>
                </div>
                <ChevronRight className={`w-4 h-4 text-neutral-800 transition-all ${isSelected ? 'rotate-90 text-purple-500' : ''}`} />
              </div>

              {isSelected && (
                <div className="px-8 pb-8 pt-4 bg-neutral-950/50 border-t border-neutral-900 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-12 text-neutral-400">
                    <div className="space-y-4">
                      <h4 className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.3em] border-b border-neutral-800 pb-2">Analysis Vectors</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between text-[11px]"><span className="text-neutral-500">Contract Safety</span><span className="font-bold text-neutral-300 tabular-nums">{alert.rugCheckScore}</span></div>
                        <div className="flex justify-between text-[11px]"><span className="text-neutral-500">Social Strength</span><span className="font-bold text-neutral-300 tabular-nums">{alert.socialSignals.overallScore}</span></div>
                        <div className="flex justify-between text-[11px]"><span className="text-neutral-500">Whale Conviction</span><span className="font-bold text-purple-400 tabular-nums">{Math.round(alert.whaleActivity.confidence * 100)}%</span></div>
                      </div>
                    </div>
                    <div className="md:col-span-2 space-y-6">
                      <div className="space-y-4">
                        <h4 className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.3em] border-b border-neutral-800 pb-2">Intelligence Brief</h4>
                        <div className="space-y-3">
                          {alert.recommendations.map((rec: string, i: number) => (
                            <div key={i} className="flex gap-2 text-[11px] text-neutral-300 font-medium leading-relaxed">
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
                              <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">AI Agent Analysis</span>
                            </div>
                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[9px] font-black uppercase rounded tabular-nums">{alert.aiAnalysis.potential} potential</span>
                          </div>

                          <p className="text-[12px] text-purple-100 italic leading-relaxed">"{alert.aiAnalysis.summary}"</p>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <div className="text-[9px] font-bold text-neutral-500 uppercase">Narrative Depth</div>
                              <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500" style={{ width: `${alert.aiAnalysis.narrativeScore}%` }} />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-[9px] font-bold text-neutral-500 uppercase">Hype Momentum</div>
                              <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${alert.aiAnalysis.hypeScore}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="pt-2">
                        <h4 className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.3em] border-b border-neutral-800 pb-2 mb-3">Volume Interval Breakdown</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <div className="text-[9px] text-neutral-500 uppercase font-bold mb-1">1 Hour</div>
                            <div className="text-xs font-bold text-neutral-300">${(alert.token.volume1h ? alert.token.volume1h / 1000 : 0).toFixed(1)}K</div>
                          </div>
                          <div>
                            <div className="text-[9px] text-neutral-500 uppercase font-bold mb-1">6 Hours</div>
                            <div className="text-xs font-bold text-neutral-300">${(alert.token.volume6h ? alert.token.volume6h / 1000 : 0).toFixed(1)}K</div>
                          </div>
                          <div>
                            <div className="text-[9px] text-neutral-500 uppercase font-bold mb-1">24 Hours</div>
                            <div className="text-xs font-bold text-neutral-300">${(alert.token.volume24h ? alert.token.volume24h / 1000 : 0).toFixed(1)}K</div>
                          </div>
                          <div>
                            <div className="text-[9px] text-neutral-500 uppercase font-bold mb-1">Total Proxy</div>
                            <div className="text-xs font-bold text-neutral-300">${(alert.token.volumeTotal ? alert.token.volumeTotal / 1000 : 0).toFixed(1)}K</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.3em] border-b border-neutral-800 pb-2">Exits</h4>
                      <div className="grid grid-cols-1 gap-2">
                        <a href={`https://jup.ag/swap/SOL-${alert.token.mint}`} target="_blank" className="flex items-center justify-center gap-2 py-2.5 bg-purple-600 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-purple-500 transition-all">Jupiter</a>
                        <a href={`https://dexscreener.com/solana/${alert.token.mint}`} target="_blank" className="flex items-center justify-center gap-2 py-2.5 border border-neutral-800 text-neutral-400 rounded text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-all">Dexscreener</a>
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
  </div>
);

const SettingsPanel = ({ settings, setSettings, telegramChatId, setTelegramChatId, onSaveSettings, isSaving, saveSuccess, onTestTelegram, subscriptionInfo }: any) => (
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
          <label className="block text-[9px] font-black text-neutral-600 uppercase tracking-[0.3em] mb-3">Min Liquidity (Safe Cash) $</label>
          <input type="number" value={settings.minLiquidity} onChange={e => setSettings({ ...settings, minLiquidity: Number(e.target.value) })} className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-3 text-sm text-neutral-200 focus:border-purple-500/50 outline-none transition-all tabular-nums font-bold" />
        </div>
        <div>
          <label className="block text-[9px] font-black text-neutral-600 uppercase tracking-[0.3em] mb-3">Min Volume Spike (Hype) %</label>
          <input type="number" value={settings.minVolumeIncrease} onChange={e => setSettings({ ...settings, minVolumeIncrease: Number(e.target.value) })} className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-3 text-sm text-neutral-200 focus:border-purple-500/50 outline-none transition-all tabular-nums font-bold" />
        </div>
        <div>
          <label className="block text-[9px] font-black text-neutral-600 uppercase tracking-[0.3em] mb-3">Max Top Holder (Fairness) %</label>
          <input type="number" value={settings.maxTopHolderPercent} onChange={e => setSettings({ ...settings, maxTopHolderPercent: Number(e.target.value) })} className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-3 text-sm text-neutral-200 focus:border-purple-500/50 outline-none transition-all tabular-nums font-bold" />
          <p className="text-[8px] text-neutral-500 mt-2 uppercase font-bold">Max % one person can own (Standard: 10%)</p>
        </div>
      </div>
      <div className="space-y-8">
        <div>
          <label className="block text-[9px] font-black text-neutral-600 uppercase tracking-[0.3em] mb-3">Quality Filter (Score 0-100)</label>
          <input type="number" value={settings.minCompositeScore} onChange={e => setSettings({ ...settings, minCompositeScore: Number(e.target.value) })} className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-3 text-sm text-neutral-200 focus:border-purple-500/50 outline-none transition-all tabular-nums font-bold" />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-neutral-950 border border-neutral-800 rounded">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400">Only Whale Activity</span>
            <button onClick={() => setSettings({ ...settings, whaleOnly: !settings.whaleOnly })} className={`w-10 h-5 rounded-full relative transition-all ${settings.whaleOnly ? 'bg-purple-600' : 'bg-neutral-800'}`}><div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-all ${settings.whaleOnly ? 'translate-x-5' : ''}`} /></button>
          </div>
          <div className="flex items-center justify-between p-4 bg-neutral-950 border border-neutral-800 rounded">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400">Telegram Notifications</span>
            <button onClick={() => setSettings({ ...settings, enableTelegramAlerts: !settings.enableTelegramAlerts })} className={`w-10 h-5 rounded-full relative transition-all ${settings.enableTelegramAlerts ? 'bg-purple-600' : 'bg-neutral-800'}`}><div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-all ${settings.enableTelegramAlerts ? 'translate-x-5' : ''}`} /></button>
          </div>
          <div>
            <label className="block text-[9px] font-black text-neutral-600 uppercase tracking-[0.3em] mb-2">Telegram Chat ID</label>
            <input
              type="text"
              value={telegramChatId}
              onChange={e => setTelegramChatId(e.target.value)}
              placeholder="e.g. 12345678"
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-3 text-sm text-neutral-200 focus:border-purple-500/50 outline-none transition-all tabular-nums font-bold"
            />
            <p className="text-[8px] text-neutral-500 mt-2 uppercase font-bold leading-relaxed">Required for private pings. Find your ID via the bot.</p>
          </div>
        </div>

        <div>
          <label className="block text-[9px] font-black text-neutral-600 uppercase tracking-[0.3em] mb-3">AI Engine Personality</label>
          <div className="grid grid-cols-3 gap-2">
            {['conservative', 'balanced', 'aggressive'].map(mode => (
              <button key={mode} onClick={() => setSettings({ ...settings, aiMode: mode as any })} className={`py-2 rounded text-[9px] font-black uppercase tracking-widest border transition-all ${settings.aiMode === mode ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : 'bg-neutral-950 border-neutral-900 text-neutral-600'}`}>{mode}</button>
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
      <button onClick={onTestTelegram} className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500 hover:text-purple-400 transition-all">Verify Bot Connection</button>
      <button onClick={() => onSaveSettings()} disabled={isSaving} className="px-10 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-purple-600/20 flex items-center gap-2">
        {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
        {isSaving ? 'Syncing...' : 'Lock Parameters'}
      </button>
    </div>
  </div>
);

const AnalyticsView = ({ alerts, scoreDistribution }: any) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <div className="border border-neutral-800 rounded bg-neutral-900/30 overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-800 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">Signal Distribution</div>
      <div className="p-6 space-y-4 text-xs">
        Data will populate as node validates signals.
      </div>
    </div>
  </div>
);

const PatternsView = ({ hourlyDistribution, performanceMetrics }: any) => (
  <div className="border border-neutral-800 rounded bg-neutral-900/30 overflow-hidden">
    <div className="px-6 py-4 border-b border-neutral-800 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">Network Volatility Cycles</div>
    <div className="p-8 text-xs text-neutral-600">
      Awaiting sufficient data points for cycle analysis.
    </div>
  </div>
);