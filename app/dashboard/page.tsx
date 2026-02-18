"use client"
import React, { useState, useEffect } from 'react';
import { EnhancedAlert, BotSettings } from '@/types';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Activity, BarChart3, RefreshCw, RefreshCw as CycleIcon, Loader2 } from 'lucide-react';

// New Components
import { Header } from '@/components/dashboard/Header';
import { MetricsBar } from '@/components/dashboard/MetricsBar';
import { SettingsPanel } from '@/components/dashboard/SettingsPanel';
import { AlertsView } from '@/components/dashboard/AlertsView';
import { AnalyticsView } from '@/components/dashboard/AnalyticsView';
import { PatternsView } from '@/components/dashboard/PatternsView';
import { BottomNav } from '@/components/dashboard/BottomNav';

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

        <Header
          session={session}
          isRunning={isRunning}
          setIsRunning={setIsRunning}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          lastScanTime={lastScanTime}
          onClearData={() => { window.localStorage.removeItem('enhanced-alerts'); setAlerts([]); }}
          onSignOut={() => signOut({ callbackUrl: '/login' })}
        />

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
        <MetricsBar
          isRunning={isRunning}
          scannedTokens={scannedTokens}
          validatedTokens={validatedTokens}
          avgCompositeScore={performanceMetrics.avgCompositeScore}
          highScoreAlerts={performanceMetrics.highScoreAlerts}
          bestHour={performanceMetrics.bestHour}
        />

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
          <AlertsView
            alerts={alerts}
            selectedAlert={selectedAlert}
            setSelectedAlert={setSelectedAlert}
          />
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

      <BottomNav
        session={session}
        isRunning={isRunning}
        setIsRunning={setIsRunning}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
      />
    </div >
  );
}