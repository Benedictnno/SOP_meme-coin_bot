"use client"
import React, { useState, useEffect } from 'react';
import { Bell, Play, Pause, Settings, Download, X, TrendingUp, Activity, CheckCircle, XCircle, DollarSign, Users, Zap, ExternalLink, RefreshCw, BarChart3, PieChart, Clock, Target, Shield, Twitter, AlertTriangle, ChevronRight, Star } from 'lucide-react';

interface TokenData {
  symbol: string;
  mint: string;
  name: string;
  narrative: string;
  liquidity: number;
  volumeIncrease: number;
  topHolderPercent: number;
  priceUSD: string;
  marketCap: number;
  socials?: {
    twitter?: string;
    telegram?: string;
    website?: string;
  };
}

interface ValidationChecks {
  narrative: boolean;
  attention: boolean;
  liquidity: boolean;
  volume: boolean;
  contract: boolean;
  holders: boolean;
  sellTest: boolean;
}

interface EnhancedAlert {
  id: string;
  timestamp: string;
  token: TokenData;
  checks: ValidationChecks;
  isValid: boolean;
  passedChecks: number;
  totalChecks: number;
  setupType: 'Base Break' | 'Pullback Entry';
  rugCheckScore: number;
  compositeScore: number;
  socialSignals: {
    twitterMentions: number;
    sentiment: string;
    overallScore: number;
  };
  whaleActivity: {
    involved: boolean;
    confidence: number;
    score: number;
  };
  timeMultiplier: number;
  recommendations: string[];
  risks: string[];
}

interface BotSettings {
  minLiquidity: number;
  maxTopHolderPercent: number;
  minVolumeIncrease: number;
  scanInterval: number;
  enableTelegramAlerts: boolean;
  minCompositeScore: number;
  minSocialScore: number;
  whaleOnly: boolean;
}

interface PerformanceMetrics {
  totalAlerts: number;
  validAlerts: number;
  avgCompositeScore: number;
  highScoreAlerts: number;
  bestHour: number;
  worstHour: number;
  whaleSuccessRate: number;
}

const validationChecks = [
  { id: 'narrative', label: 'Narrative', icon: TrendingUp },
  { id: 'attention', label: 'Attention', icon: Activity },
  { id: 'liquidity', label: 'Liquidity', icon: DollarSign },
  { id: 'volume', label: 'Volume', icon: Users },
  { id: 'contract', label: 'Contract', icon: CheckCircle },
  { id: 'holders', label: 'Holders', icon: Users },
  { id: 'sellTest', label: 'Sell Test', icon: Zap }
];

export default function EnhancedAnalyticsDashboard() {
  const [isRunning, setIsRunning] = useState(false);
  const [alerts, setAlerts] = useState<EnhancedAlert[]>([]);
  const [scannedTokens, setScannedTokens] = useState(0);
  const [validatedTokens, setValidatedTokens] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<EnhancedAlert | null>(null);
  const [activeView, setActiveView] = useState<'alerts' | 'analytics' | 'patterns'>('alerts');

  const [settings, setSettings] = useState<BotSettings>({
    minLiquidity: 50000,
    maxTopHolderPercent: 10,
    minVolumeIncrease: 200,
    scanInterval: 60,
    enableTelegramAlerts: false,
    minCompositeScore: 50,
    minSocialScore: 30,
    whaleOnly: false
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

  // Load from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = window.localStorage.getItem('enhanced-alerts');
        if (stored) {
          const data = JSON.parse(stored);
          setAlerts(data.alerts || []);
          setScannedTokens(data.scannedTokens || 0);
          setValidatedTokens(data.validatedTokens || 0);
          calculateMetrics(data.alerts || []);
        }
      } catch (err) {
        console.log('No stored data');
      }
    };
    loadData();
  }, []);

  // Save to storage
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

    // Calculate best/worst hours
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

    // Whale success rate
    const whaleAlerts = alertList.filter(a => a.whaleActivity.involved);
    if (whaleAlerts.length > 0) {
      const whaleHighScore = whaleAlerts.filter(a => a.compositeScore >= 70).length;
      metrics.whaleSuccessRate = Math.round((whaleHighScore / whaleAlerts.length) * 100);
    }

    setPerformanceMetrics(metrics);
  };

  const runScan = async () => {
    setIsScanning(true);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (data.success) {
        console.log(`Scan successful: Found ${data.alerts.length} alerts`, data);
        setScannedTokens(prev => prev + data.scanned);
        setValidatedTokens(prev => prev + data.valid);

        setAlerts(prev => {
          // Create a Map from the previous alerts for quick lookup by mint
          const alertMap = new Map(prev.map(a => [a.token.mint, a]));

          // Add/Update with new alerts
          data.alerts.forEach((newAlert: EnhancedAlert) => {
            alertMap.set(newAlert.token.mint, newAlert);
          });

          // Convert back to array and sort by composite score (highest first)
          return Array.from(alertMap.values())
            .sort((a, b) => b.compositeScore - a.compositeScore)
            .slice(0, 100);
        });

        setLastScanTime(new Date());
      } else {
        console.error('Scan API returned failure:', data.error);
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
      runScan(); // Run immediately on start
      interval = setInterval(runScan, settings.scanInterval * 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, settings.scanInterval]);

  // Score visual helper is now replaced by direct color classes in components

  const exportAlerts = () => {
    const csv = [
      ['Timestamp', 'Symbol', 'Composite Score', 'Valid', 'Liquidity', 'Volume %', 'Social Score', 'Whale', 'Setup'],
      ...alerts.map(a => [
        new Date(a.timestamp).toLocaleString(),
        a.token.symbol,
        a.compositeScore,
        a.isValid ? 'Yes' : 'No',
        a.token.liquidity,
        a.token.volumeIncrease,
        a.socialSignals.overallScore,
        a.whaleActivity.involved ? 'Yes' : 'No',
        a.setupType
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enhanced-alerts-${Date.now()}.csv`;
    a.click();
  };

  const scoreDistribution = alerts.reduce((acc, alert) => {
    const bucket = Math.floor(alert.compositeScore / 10) * 10;
    acc[bucket] = (acc[bucket] || 0) + 1;
    return acc;
  }, {} as { [key: number]: number });

  const hourlyDistribution = alerts.reduce((acc, alert) => {
    const hour = new Date(alert.timestamp).getHours();
    if (!acc[hour]) acc[hour] = { count: 0, totalScore: 0 };
    acc[hour].count++;
    acc[hour].totalScore += alert.compositeScore;
    return acc;
  }, {} as { [key: number]: { count: number; totalScore: number } });

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200">
      {/* Header */}
      <div className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 border border-neutral-700 bg-neutral-800 rounded flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">MemeScanner Terminal</h1>
                <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">On-Chain Analytics • Live</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex bg-neutral-800 p-1 rounded-md border border-neutral-700 mr-2">
                <button
                  onClick={() => setActiveView('alerts')}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition ${activeView === 'alerts'
                    ? 'bg-neutral-700 text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                >
                  Feed
                </button>
                <button
                  onClick={() => setActiveView('analytics')}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition ${activeView === 'analytics'
                    ? 'bg-neutral-700 text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                >
                  Analytics
                </button>
                <button
                  onClick={() => setActiveView('patterns')}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition ${activeView === 'patterns'
                    ? 'bg-neutral-700 text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                >
                  Historical
                </button>
              </div>

              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 border border-neutral-700 hover:bg-neutral-800 rounded transition text-neutral-400"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={exportAlerts}
                disabled={alerts.length === 0}
                className="p-2 border border-neutral-700 hover:bg-neutral-800 disabled:opacity-30 rounded transition text-neutral-400"
                title="Export Data"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`ml-1 px-4 py-2 rounded font-semibold transition text-xs flex items-center gap-2 ${isRunning
                  ? 'bg-neutral-800 border border-red-900/50 text-red-400 hover:bg-red-900/10'
                  : 'bg-accent text-white hover:bg-accent/90'
                  }`}
              >
                {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isRunning ? 'Stop Scan' : 'Start Feed'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {showSettings && (
          <SettingsPanel
            settings={settings}
            setSettings={setSettings}
            onClose={() => setShowSettings(false)}
          />
        )}
        {/* Performance Metrics Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-6 border border-neutral-800 rounded bg-neutral-900/30 mb-8 divide-x divide-neutral-800 overflow-hidden">
          <div className="p-4">
            <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1">System Status</div>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-neutral-600'}`} />
              <span className="text-xs font-semibold uppercase tracking-tight">{isRunning ? 'Connected' : 'Offline'}</span>
            </div>
          </div>

          <div className="p-4">
            <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1">Assets Scanned</div>
            <div className="text-lg font-semibold text-neutral-200 tabular-nums">{scannedTokens.toLocaleString()}</div>
          </div>

          <div className="p-4">
            <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1">Qualified</div>
            <div className="text-lg font-semibold text-neutral-200 tabular-nums">{validatedTokens.toLocaleString()}</div>
          </div>

          <div className="p-4">
            <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1">Avg Score</div>
            <div className={`text-lg font-semibold tabular-nums ${performanceMetrics.avgCompositeScore >= 70 ? 'text-green-500' : 'text-neutral-200'}`}>
              {performanceMetrics.avgCompositeScore}
            </div>
          </div>

          <div className="p-4">
            <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1">High Signal</div>
            <div className="text-lg font-semibold text-neutral-200 tabular-nums">{performanceMetrics.highScoreAlerts}</div>
          </div>

          <div className="p-4">
            <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1">Peak Hour</div>
            <div className="text-lg font-semibold text-neutral-200 tabular-nums">{performanceMetrics.bestHour.toString().padStart(2, '0')}:00</div>
          </div>
        </div>

        {isScanning && (
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 animate-spin text-purple-400" />
              <div className="flex-1">
                <div className="font-semibold">Enhanced Scanning in Progress...</div>
                <div className="text-sm text-slate-400">Running full validation with composite scoring</div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
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
            performanceMetrics={performanceMetrics}
            scoreDistribution={scoreDistribution}
          />
        )}

        {activeView === 'patterns' && (
          <PatternsView
            hourlyDistribution={hourlyDistribution}
            performanceMetrics={performanceMetrics}
          />
        )}
      </div>
    </div>
  );
}

// Alerts View Component
const AlertsView = ({ alerts, selectedAlert, setSelectedAlert }: any) => (
  <div className="border border-neutral-800 rounded bg-neutral-900/30 overflow-hidden">
    <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-bold tracking-tight uppercase">Live Feed</h2>
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
      </div>
      <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{alerts.length} signals found</div>
    </div>

    {alerts.length === 0 ? (
      <div className="text-center py-24 flex flex-col items-center">
        <div className="w-12 h-12 border border-neutral-800 rounded flex items-center justify-center mb-4 text-neutral-700">
          <Bell className="w-6 h-6" />
        </div>
        <p className="text-sm text-neutral-500 font-medium tracking-tight">System initialized. Waiting for on-chain events...</p>
      </div>
    ) : (
      <div className="divide-y divide-neutral-800/50 max-h-[800px] overflow-y-auto">
        {alerts.map((alert: EnhancedAlert) => {
          const isSelected = selectedAlert?.id === alert.id;
          return (
            <div key={alert.id} className="group transition-colors">
              <div
                onClick={() => setSelectedAlert(isSelected ? null : alert)}
                className={`px-6 py-4 flex items-center gap-6 cursor-pointer hover:bg-neutral-800/30 ${isSelected ? 'bg-neutral-800/50' : ''}`}
              >
                <div className="w-12 flex flex-col items-center">
                  <span className={`text-lg font-bold tabular-nums tracking-tighter ${alert.compositeScore >= 80 ? 'text-green-400' :
                    alert.compositeScore >= 60 ? 'text-blue-400' : 'text-neutral-400'
                    }`}>
                    {alert.compositeScore}
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-neutral-600 font-bold">Score</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-sm font-bold text-neutral-200 tracking-tight">{alert.token.symbol}</h3>
                    <span className="text-[10px] px-1.5 py-0.5 border border-neutral-700 text-neutral-400 rounded uppercase font-bold tracking-wider">
                      {alert.setupType}
                    </span>
                    {alert.whaleActivity.involved && (
                      <span className="flex items-center gap-1 text-[10px] text-blue-400 font-bold uppercase tracking-wider">
                        <span className="w-1 h-1 rounded-full bg-blue-400" />
                        Whale
                      </span>
                    )}
                    {alert.bundleAnalysis?.isBundled && (
                      <span className="flex items-center gap-1 text-[10px] text-red-500 font-bold uppercase tracking-wider">
                        <span className="w-1 h-1 rounded-full bg-red-500" />
                        Bundled
                      </span>
                    )}
                    {alert.devScore && alert.devScore.reputation === 'High' && (
                      <span className="flex items-center gap-1 text-[10px] text-green-500 font-bold uppercase tracking-wider">
                        <Star className="w-2.5 h-2.5" />
                        Elite Dev
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-[11px] text-neutral-500 font-medium tabular-nums">
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                    <p className="text-[11px] text-neutral-600 font-mono truncate max-w-[120px]">
                      {alert.token.mint}
                    </p>
                  </div>
                </div>

                <div className="hidden md:grid grid-cols-2 gap-x-8 gap-y-1 text-right whitespace-nowrap">
                  <div>
                    <span className="text-[10px] text-neutral-600 font-bold uppercase mr-2">Liq</span>
                    <span className="text-xs text-neutral-400 font-medium tabular-nums">${(alert.token.liquidity / 1000).toFixed(1)}k</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-600 font-bold uppercase mr-2">Vol Δ</span>
                    <span className="text-xs text-green-500/80 font-medium tabular-nums">+{alert.token.volumeIncrease.toFixed(0)}%</span>
                  </div>
                </div>

                <div className="w-8 flex justify-end">
                  <ChevronRight className={`w-4 h-4 text-neutral-700 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                </div>
              </div>

              {isSelected && (
                <div className="px-6 pb-6 pt-2 bg-neutral-900/50 border-t border-neutral-800/30">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-4">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-800 pb-1">Validation Analysis</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-400">Security Score</span>
                          <span className="text-xs font-bold text-neutral-300">{alert.rugCheckScore}/100</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-400">Social Momentum</span>
                          <span className="text-xs font-bold text-neutral-300">{alert.socialSignals.overallScore}/100</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-400">Whale Confidence</span>
                          <span className="text-xs font-bold text-neutral-300">{Math.round(alert.whaleActivity.confidence * 100)}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-800 pb-1">Trench Safety</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-400">Dev Reputation</span>
                          <span className={`text-xs font-bold ${alert.devScore?.reputation === 'High' ? 'text-green-400' : alert.devScore?.reputation === 'Low' ? 'text-red-400' : 'text-neutral-400'}`}>
                            {alert.devScore?.reputation || 'New'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-400">Bundle Status</span>
                          <span className={`text-xs font-bold ${alert.bundleAnalysis?.isBundled ? 'text-red-400' : 'text-green-400'}`}>
                            {alert.bundleAnalysis?.isBundled ? 'Flagged' : 'Clean'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-400">Sybil Count</span>
                          <span className={`text-xs font-bold ${alert.bundleAnalysis?.sybilCount && alert.bundleAnalysis.sybilCount > 2 ? 'text-yellow-400' : 'text-neutral-400'}`}>
                            {alert.bundleAnalysis?.sybilCount || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-800 pb-1">Action items</h4>
                      <div className="space-y-2">
                        {alert.recommendations.map((rec, i) => (
                          <div key={i} className="flex gap-2 text-xs text-neutral-300 items-start">
                            <span className="text-neutral-600 mt-0.5">•</span>
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 text-right">
                      <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-800 pb-1">External Tools</h4>
                      <div className="grid grid-cols-1 gap-2">
                        <a
                          href={`https://jup.ag/swap/SOL-${alert.token.mint}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-accent text-white rounded text-[11px] font-bold hover:bg-accent/90 transition"
                        >
                          Jupiter <ExternalLink className="w-3 h-3" />
                        </a>
                        <a
                          href={`https://dexscreener.com/solana/${alert.token.mint}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 px-3 py-2 border border-neutral-700 text-neutral-300 rounded text-[11px] font-bold hover:bg-neutral-800 transition"
                        >
                          DexScreener <ExternalLink className="w-3 h-3" />
                        </a>
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

// Analytics View Component
const AnalyticsView = ({ alerts, performanceMetrics, scoreDistribution }: any) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    {/* Score Distribution */}
    <div className="border border-neutral-800 rounded bg-neutral-900/30 overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-900/50 flex items-center gap-2">
        <PieChart className="w-4 h-4 text-neutral-500" />
        <h3 className="text-xs font-bold uppercase tracking-wider">Signal Distribution</h3>
      </div>
      <div className="p-6 space-y-3">
        {[90, 80, 70, 60, 50, 40, 30, 20, 10, 0].map(bucket => {
          const count = scoreDistribution[bucket] || 0;
          const percentage = alerts.length > 0 ? (count / alerts.length) * 100 : 0;
          return (
            <div key={bucket} className="flex items-center gap-4">
              <div className="w-12 text-[10px] font-bold text-neutral-500 tabular-nums">{bucket}-{bucket + 9}</div>
              <div className="flex-1 bg-neutral-800/50 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${bucket >= 80 ? 'bg-green-500' :
                    bucket >= 60 ? 'bg-blue-500' : 'bg-neutral-600'
                    }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="w-8 text-[10px] font-bold text-neutral-400 text-right tabular-nums">{count}</div>
            </div>
          );
        })}
      </div>
    </div>

    {/* Performance Summary */}
    <div className="border border-neutral-800 rounded bg-neutral-900/30 overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-900/50 flex items-center gap-2">
        <Target className="w-4 h-4 text-neutral-500" />
        <h3 className="text-xs font-bold uppercase tracking-wider">Historical Accuracy</h3>
      </div>
      <div className="p-6 grid grid-cols-1 gap-4">
        <div className="border border-neutral-800 bg-neutral-950/50 rounded p-4">
          <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Success Rate</div>
          <div className="text-2xl font-bold text-neutral-200 tabular-nums">
            {alerts.length > 0 ? ((performanceMetrics.validAlerts / performanceMetrics.totalAlerts) * 100).toFixed(1) : '0.0'}%
          </div>
          <p className="text-[10px] text-neutral-600 font-medium mt-1">{performanceMetrics.validAlerts} verified signals / {performanceMetrics.totalAlerts} total</p>
        </div>

        <div className="border border-neutral-800 bg-neutral-950/50 rounded p-4">
          <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">High-Confidence Conversion</div>
          <div className="text-2xl font-bold text-neutral-200 tabular-nums">
            {alerts.length > 0 ? ((performanceMetrics.highScoreAlerts / performanceMetrics.totalAlerts) * 100).toFixed(1) : '0.0'}%
          </div>
          <p className="text-[10px] text-neutral-600 font-medium mt-1">{performanceMetrics.highScoreAlerts} signals reached 70+ threshold</p>
        </div>

        <div className="border border-neutral-800 bg-neutral-950/50 rounded p-4">
          <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Whale Participation Success</div>
          <div className="text-2xl font-bold text-neutral-200 tabular-nums">
            {performanceMetrics.whaleSuccessRate}%
          </div>
          <p className="text-[10px] text-neutral-600 font-medium mt-1">Correlation between whale activity and positive price action</p>
        </div>
      </div>
    </div>

    {/* Top Performers */}
    <div className="lg:col-span-2 border border-neutral-800 rounded bg-neutral-900/30 overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-900/50 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-neutral-500" />
        <h3 className="text-xs font-bold uppercase tracking-wider">Top Efficiency Assets</h3>
      </div>
      <div className="divide-y divide-neutral-800/50">
        {alerts
          .sort((a: EnhancedAlert, b: EnhancedAlert) => b.compositeScore - a.compositeScore)
          .slice(0, 5)
          .map((alert: EnhancedAlert) => (
            <div key={alert.id} className="px-6 py-4 flex items-center justify-between hover:bg-neutral-800/20 transition-colors">
              <div className="flex items-center gap-6">
                <div className={`w-10 text-xl font-bold tabular-nums tracking-tighter ${alert.compositeScore >= 80 ? 'text-green-400' : 'text-neutral-400'
                  }`}>
                  {alert.compositeScore}
                </div>
                <div>
                  <div className="text-sm font-bold text-neutral-200">{alert.token.symbol}</div>
                  <div className="text-[10px] text-neutral-500 font-medium tabular-nums">{new Date(alert.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>
                </div>
              </div>
              <div className="flex gap-2">
                {alert.whaleActivity.involved && (
                  <span className="px-2 py-0.5 border border-blue-900/30 bg-blue-900/10 text-blue-400 text-[9px] font-bold uppercase tracking-wider rounded">Whale</span>
                )}
                {alert.socialSignals.overallScore > 70 && (
                  <span className="px-2 py-0.5 border border-neutral-700 bg-neutral-800 text-neutral-400 text-[9px] font-bold uppercase tracking-wider rounded">Social</span>
                )}
                {alert.isValid && (
                  <span className="px-2 py-0.5 border border-green-900/30 bg-green-900/10 text-green-500 text-[9px] font-bold uppercase tracking-wider rounded">Verified</span>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  </div>
);

// Settings Panel Component
const SettingsPanel = ({ settings, setSettings, onClose }: any) => (
  <div className="border border-neutral-800 rounded bg-neutral-900 shadow-2xl overflow-hidden mb-8 max-w-5xl mx-auto">
    <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Settings className="w-4 h-4 text-neutral-500" />
        <h3 className="text-xs font-bold uppercase tracking-widest">Configuration Console</h3>
      </div>
      <button onClick={onClose} className="p-1 hover:bg-neutral-800 rounded text-neutral-500 transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>

    <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-12">
      <div className="space-y-6">
        <div className="space-y-1">
          <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Discovery Filters</h4>
          <p className="text-[10px] text-neutral-600 font-medium">Define baseline liquidity and volume requirements.</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1.5 ml-1">Min Liquidity (USD)</label>
            <input
              type="number"
              value={settings.minLiquidity}
              onChange={(e) => setSettings({ ...settings, minLiquidity: Number(e.target.value) })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-200 focus:border-accent outline-none transition-colors tabular-nums"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1.5 ml-1">Min Volume Spike (%)</label>
            <input
              type="number"
              value={settings.minVolumeIncrease}
              onChange={(e) => setSettings({ ...settings, minVolumeIncrease: Number(e.target.value) })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-200 focus:border-accent outline-none transition-colors tabular-nums"
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-1">
          <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Signal Sensitivity</h4>
          <p className="text-[10px] text-neutral-600 font-medium">Control the thresholds for alert generation.</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1.5 ml-1">Composite Threshold</label>
            <input
              type="number"
              max="100" min="0"
              value={settings.minCompositeScore}
              onChange={(e) => setSettings({ ...settings, minCompositeScore: Math.min(100, Number(e.target.value)) })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-200 focus:border-accent outline-none transition-colors tabular-nums"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1.5 ml-1">Max Top Holder %</label>
            <input
              type="number"
              value={settings.maxTopHolderPercent}
              onChange={(e) => setSettings({ ...settings, maxTopHolderPercent: Number(e.target.value) })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-200 focus:border-accent outline-none transition-colors tabular-nums"
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-1">
          <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">System Engine</h4>
          <p className="text-[10px] text-neutral-600 font-medium">Low-level scanning and notification parameters.</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1.5 ml-1">Polling Interval (SEC)</label>
            <input
              type="number"
              value={settings.scanInterval}
              onChange={(e) => setSettings({ ...settings, scanInterval: Number(e.target.value) })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-200 focus:border-accent outline-none transition-colors tabular-nums"
            />
          </div>
          <div className="flex items-center justify-between p-3 border border-neutral-800 bg-neutral-950 rounded mt-4">
            <span className="text-[10px] font-bold text-neutral-400 uppercase">Whale Protocol Only</span>
            <button
              onClick={() => setSettings({ ...settings, whaleOnly: !settings.whaleOnly })}
              className={`w-10 h-5 rounded-full relative transition-colors ${settings.whaleOnly ? 'bg-accent' : 'bg-neutral-800'}`}
            >
              <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${settings.whaleOnly ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);


// Patterns View Component
const PatternsView = ({ hourlyDistribution, performanceMetrics }: any) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <div className="lg:col-span-2 border border-neutral-800 rounded bg-neutral-900/30 overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-neutral-500" />
          <h2 className="text-xs font-bold tracking-tight uppercase">Temporal Signal Density</h2>
        </div>
        <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">24-Hour Network Cycle</div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
          {Array.from({ length: 24 }).map((_, i) => {
            const data = hourlyDistribution[i] || { count: 0, totalScore: 0 };
            const avgScore = data.count > 0 ? Math.round(data.totalScore / data.count) : 0;
            const maxCount = Math.max(...Object.values(hourlyDistribution).map((d: any) => d.count), 1);
            const barWidth = (data.count / maxCount) * 100;

            return (
              <div key={i} className="flex items-center gap-3 py-0.5 group">
                <div className="w-8 text-[10px] font-bold text-neutral-600 tabular-nums">{i.toString().padStart(2, '0')}:00</div>
                <div className="flex-1 bg-neutral-800/10 h-3 rounded-px overflow-hidden flex items-center">
                  <div
                    className={`h-full transition-all duration-700 ${i === performanceMetrics.bestHour ? 'bg-blue-500/50' :
                      i === performanceMetrics.worstHour ? 'bg-neutral-800' : 'bg-neutral-700/40'
                      }`}
                    style={{ width: `${Math.max(barWidth, 1)}%` }}
                  />
                </div>
                <div className="w-16 text-right flex items-center justify-end gap-2">
                  <span className="text-[10px] font-bold text-neutral-400 tabular-nums">{data.count}</span>
                  <span className={`text-[9px] font-bold uppercase tabular-nums ${avgScore >= 70 ? 'text-green-500/70' : 'text-neutral-600'}`}>{avgScore}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>

    <div className="space-y-6">
      <div className="border border-neutral-800 rounded bg-neutral-900/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-900/50">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Optimization Insights</h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold uppercase tracking-tight">Peak Window</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Target signals between <span className="text-neutral-200 font-bold tabular-nums">{performanceMetrics.bestHour}:00</span> and <span className="text-neutral-200 font-bold tabular-nums">{(performanceMetrics.bestHour + 2) % 24}:00</span> for maximum conversion efficiency.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-neutral-500">
              <Zap className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold uppercase tracking-tight">System Efficiency</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Whale participation signals are showing a <span className="text-neutral-200 font-bold tabular-nums">{performanceMetrics.whaleSuccessRate}%</span> correlation with high-conviction outcomes.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-neutral-500">
              <Shield className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold uppercase tracking-tight">Safety Protocol</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Composite scores below <span className="text-neutral-200 font-bold tabular-nums">40</span> should be discarded regardless of narrative strength.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);