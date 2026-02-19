"use client"
import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="font-sans antialiased text-white bg-background-dark selection:bg-primary/30">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass-nav">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/sop-logo.svg" alt="SOP Logo" className="w-10 h-10 rounded-lg shadow-lg shadow-primary/20" />
            <span className="font-display text-2xl font-bold tracking-tight">SOP<span className="text-primary">SCANNER</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
            <a className="hover:text-primary transition-colors" href="#features">Features</a>
            <Link className="hover:text-primary transition-colors" href="/dashboard">Dashboard</Link>
            <Link className="hover:text-primary transition-colors" href="/login">Login</Link>
            <Link className="px-5 py-2.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-full text-primary transition-all font-bold" href="/register">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        <div className="absolute inset-0 circuit-bg opacity-30 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background-dark/50 to-background-dark pointer-events-none"></div>
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mt-3 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            V1.0 NOW LIVE - ACCESS GRANTED
          </div>
          <h1 className="font-display text-5xl md:text-8xl font-bold tracking-tight leading-tight mb-8">
            Stop Getting Rugged. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Start Trading with SOP.</span>
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-12">
            The ultimate security validator for Solana meme coin traders. Real-time contract hardening, whale detection, and organic filter simulations.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-4 bg-primary text-background-dark font-bold rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 group shadow-lg shadow-primary/20"
            >
              Start Scanning Now
              <span className="material-icons-round transition-transform group-hover:translate-x-1">arrow_forward</span>
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2"
            >
              Create Account
            </Link>
          </div>
          <p className="mt-8 text-sm text-white/40">Trusted by 5,000+ active traders scanning DeFi opportunities.</p>
        </div>
      </section>

      {/* Live Analysis Engine - MacBook Mockup */}
      <section className="py-24 relative" id="scanner">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold mb-4">Live Analysis Engine</h2>
            <p className="text-white/60">Real-time breakdown of any SPL token address.</p>
          </div>
          <div className="relative max-w-5xl mx-auto">
            <div className="macbook-frame">
              <div className="macbook-screen">
                <div className="bg-terminal-dark h-full w-full flex flex-col font-mono text-[10px] md:text-xs">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-terminal-border bg-black/40">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                      </div>
                      <div className="ml-2 flex flex-col">
                        <span className="text-white font-bold tracking-tight">MemeScanner Terminal</span>
                        <span className="text-[9px] text-primary/70">ON-CHAIN ANALYTICS • LIVE</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/10">
                        <button className="px-3 py-1 bg-white/10 rounded-md text-white">Feed</button>
                        <button className="px-3 py-1 hover:text-white text-white/40">Analytics</button>
                        <button className="px-3 py-1 hover:text-white text-white/40">Historical</button>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <span className="material-symbols-outlined text-white/40 scale-75 cursor-pointer hover:text-white transition-colors">settings</span>
                        <span className="material-symbols-outlined text-white/40 scale-75 cursor-pointer hover:text-white transition-colors">download</span>
                        <div className="flex items-center gap-1 px-3 py-1 border border-red-500/30 text-red-400 bg-red-500/10 rounded-md">
                          <span className="material-symbols-outlined text-sm">pause</span>
                          <span className="text-[10px] font-bold">Stop Scan</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-5 border-b border-terminal-border">
                    {[
                      { label: 'System Status', value: 'CONNECTED', color: 'text-success', pulse: true },
                      { label: 'Assets Scanned', value: '659' },
                      { label: 'Qualified', value: '88' },
                      { label: 'Avg Score', value: '77', color: 'text-success' },
                      { label: 'High Signal', value: '17' },
                    ].map((stat, i) => (
                      <div key={i} className={`p-4 ${i < 4 ? 'border-r border-terminal-border' : ''}`}>
                        <div className="text-[9px] text-white/40 uppercase mb-1">{stat.label}</div>
                        <div className={`flex items-center gap-2 ${stat.color || 'text-white'} font-bold md:text-lg`}>
                          {stat.pulse && <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>}
                          {stat.value}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="m-4 p-4 rounded-xl bg-secondary/5 border border-secondary/20 flex items-center gap-4">
                    <span className="material-symbols-outlined text-secondary animate-spin">sync</span>
                    <div>
                      <div className="text-white font-bold">Enhanced Scanning in Progress...</div>
                      <div className="text-white/40 text-[10px]">Running full validation with composite scoring</div>
                    </div>
                  </div>
                  <div className="px-4 pb-4 flex-1 overflow-hidden">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold uppercase tracking-wider">Live Feed</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      </div>
                      <div className="text-[9px] text-white/20">29 SIGNALS FOUND</div>
                    </div>
                    <div className="border border-terminal-border bg-black/20 rounded-xl overflow-hidden shadow-inner">
                      <div className="p-4 border-b border-terminal-border flex justify-between items-center bg-white/[0.02]">
                        <div className="flex items-center gap-6">
                          <div className="flex flex-col items-center">
                            <div className="text-2xl font-black text-success leading-none">100</div>
                            <div className="text-[8px] text-success/60 uppercase font-bold mt-1">Score</div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg font-bold text-white">MEEK</span>
                              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] text-white/40 uppercase">Pullback Entry</span>
                            </div>
                            <div className="text-[9px] text-white/30 flex gap-3">
                              <span>00:12:18</span>
                              <span className="font-mono">FLeuXXyxKqrDU8MULU...</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="text-right">
                            <div className="text-[9px] text-white/30 uppercase">Liq</div>
                            <div className="text-white font-bold">$80.7k</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[9px] text-white/30 uppercase">Vol Δ</div>
                            <div className="text-success font-bold">+435%</div>
                          </div>
                          <span className="material-symbols-outlined text-white/20">expand_more</span>
                        </div>
                      </div>
                      <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-8 bg-black/20">
                        <div className="space-y-3">
                          <div className="text-[9px] text-white/40 uppercase tracking-widest font-bold border-b border-white/5 pb-1">Validation Analysis</div>
                          <div className="space-y-2">
                            {[
                              { label: 'Security Score', value: '501/100' },
                              { label: 'Social Momentum', value: '100/100' },
                              { label: 'Whale Confidence', value: '6000%' }
                            ].map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-[10px]">
                                <span className="text-white/40">{item.label}</span>
                                <span className="text-white font-bold">{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="text-[9px] text-white/40 uppercase tracking-widest font-bold border-b border-white/5 pb-1">Trench Safety</div>
                          <div className="space-y-2">
                            {[
                              { label: 'Dev Reputation', value: 'New', color: 'text-primary' },
                              { label: 'Bundle Status', value: 'Clean', color: 'text-success' },
                              { label: 'Sybil Count', value: '0' }
                            ].map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-[10px]">
                                <span className="text-white/40">{item.label}</span>
                                <span className={`${item.color || 'text-white'} font-bold uppercase`}>{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="text-[9px] text-white/40 uppercase tracking-widest font-bold border-b border-white/5 pb-1">Action Items</div>
                          <div className="flex items-center gap-2 px-3 py-2 bg-success/10 border border-success/30 rounded-lg text-success">
                            <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                            <span className="text-[10px] font-bold">STRONG BUY - All signals aligned</span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="text-[9px] text-white/40 uppercase tracking-widest font-bold text-right border-b border-white/5 pb-1">External Tools</div>
                          <div className="space-y-2">
                            <button className="w-full py-2 bg-[#3a82f6] hover:bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-[10px] font-bold">
                              Jupiter <span className="material-symbols-outlined text-xs">open_in_new</span>
                            </button>
                            <button className="w-full py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-[10px] font-bold">
                              DexScreener <span className="material-symbols-outlined text-xs">open_in_new</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="macbook-base max-w-4xl mx-auto -mt-4"></div>
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/5 blur-[120px] rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Live Alpha Feed - Telegram Mockup */}
      <section className="py-24 relative" id="feed">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold mb-4">Live Alpha Feed</h2>
            <p className="text-white/60">Connect to the mainnet signal stream. Never miss a legitimate breakout.</p>
          </div>
          <div className="telegram-window font-sans">
            <div className="bg-white/5 px-6 py-4 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined font-bold">campaign</span>
                </div>
                <div>
                  <div className="font-bold text-white">SOP Alpha Scanner</div>
                  <div className="text-xs text-primary/70 font-semibold tracking-tight">8,421 members • 1,202 online</div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-white/40">
                <span className="material-symbols-outlined cursor-pointer hover:text-white transition-colors">search</span>
                <span className="material-symbols-outlined cursor-pointer hover:text-white transition-colors">more_vert</span>
              </div>
            </div>
            <div className="p-6 space-y-6 bg-[rgba(8,8,8,0.5)] grid-pattern min-h-[500px] flex flex-col justify-end">
              {/* Message 1 */}
              <div className="tg-msg self-start">
                <div className="p-4 rounded-2xl rounded-tl-none border-l-4 border-primary bg-[#121212] shadow-xl">
                  <div className="text-[11px] font-black text-primary mb-2 tracking-widest uppercase">SOP SCANNER ALERT</div>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-white/40 font-semibold">Token:</span> <span className="text-white font-mono font-bold">$PEPE_SOL</span></p>
                    <p><span className="text-white/40 font-semibold">Score:</span> <span className="text-success font-bold">98/100</span></p>
                    <p><span className="text-white/40 font-semibold">Liquidity Locked:</span> <span className="text-white font-bold">100%</span></p>
                    <p><span className="text-white/40 font-semibold">Whale Check:</span> <span className="text-success font-bold uppercase">Passed</span></p>
                  </div>
                  <button className="mt-4 w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg border border-primary/30 transition-all active:scale-95">
                    [ BUY ON JUPITER ]
                  </button>
                </div>
                <div className="text-[10px] text-white/20 mt-1 ml-2 font-bold uppercase tracking-wider">12:45 PM</div>
              </div>

              {/* Message 2 */}
              <div className="tg-msg self-start">
                <div className="p-4 rounded-2xl rounded-tl-none border-l-4 border-primary bg-[#121212] shadow-xl">
                  <div className="text-[11px] font-black text-primary mb-2 tracking-widest uppercase">SOP SCANNER ALERT</div>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-white/40 font-semibold">Token:</span> <span className="text-white font-mono font-bold">$DOGE_X</span></p>
                    <p><span className="text-white/40 font-semibold">Score:</span> <span className="text-success font-bold">94/100</span></p>
                    <p><span className="text-white/40 font-semibold">Metadata Verified:</span> <span className="text-success font-bold uppercase">Yes</span></p>
                  </div>
                  <button className="mt-4 w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg border border-primary/30 transition-all active:scale-95">
                    [ BUY ON JUPITER ]
                  </button>
                </div>
                <div className="text-[10px] text-white/20 mt-1 ml-2 font-bold uppercase tracking-wider">12:48 PM</div>
              </div>

              {/* Rug Detected */}
              <div className="tg-msg self-start">
                <div className="p-4 rounded-2xl rounded-tl-none border-l-4 border-red-500 bg-[#121212] shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                  <div className="text-[11px] font-black text-red-500 mb-2 tracking-widest uppercase">RUG DETECTED</div>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-white/40 font-semibold">Token:</span> <span className="text-white/80 font-mono font-bold">$SCAM_COIN</span></p>
                    <p><span className="text-white/40 font-semibold">Reason:</span> <span className="text-red-400 font-bold uppercase italic tracking-tight">Hidden Mint Function</span></p>
                  </div>
                  <div className="mt-3 text-[10px] text-red-500/50 flex items-center gap-1 font-bold italic tracking-wide">
                    <span className="material-symbols-outlined text-xs">warning</span>
                    AVOID THIS CONTRACT
                  </div>
                </div>
                <div className="text-[10px] text-white/20 mt-1 ml-2 font-bold uppercase tracking-wider">12:52 PM</div>
              </div>
            </div>
            <div className="p-4 bg-white/5 border-t border-white/10 flex gap-4">
              <Link href="/dashboard" className="flex-1 py-4 bg-secondary text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-all glow-purple-hover active:scale-95">
                <span className="material-icons-round">send</span>
                Access the Alpha Stream
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SOP Section */}
      <section className="py-24 bg-white/[0.02]" id="features">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div className="max-w-xl">
              <h2 className="font-display text-4xl font-bold mb-4 uppercase tracking-tight">The SOP 7-Point Security Standard</h2>
              <p className="text-white/60 text-lg font-medium leading-relaxed">Every scan goes through our rigorous 7-layer validation protocol to ensure your capital stays safe.</p>
            </div>
            <div className="text-primary font-bold flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full border border-primary/20 text-sm tracking-wide">
              <span className="material-icons-round text-lg">security</span>
              Bank-Grade Verification
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Metadata Check', desc: 'Verification of social links, mint authority, and mutable metadata consistency.', icon: 'description', color: 'text-primary' },
              { title: 'Volume Spike', desc: 'Detection of wash trading and artificial volume generation from bot clusters.', icon: 'trending_up', color: 'text-primary' },
              { title: 'Liquidity Depth', desc: 'Real-time analysis of LP lock status and effective sell-side liquidity impact.', icon: 'layers', color: 'text-primary' },
              { title: 'Organic Filter', desc: 'Differentiates between coordinated shills and genuine community growth.', icon: 'filter_alt', color: 'text-primary' },
              { title: 'Contract Hardening', desc: 'Deep byte-code analysis to detect hidden mint, freeze, or blacklisting functions.', icon: 'terminal', color: 'text-secondary' },
              { title: 'Whale/Bundle', desc: 'Identify sniper bundles and early holder concentration across multiple wallets.', icon: 'groups', color: 'text-secondary' },
              { title: 'Jupiter Simulation', desc: 'Proprietary simulation of trade execution to predict slippage and potential honeypots before you buy.', icon: 'model_training', color: 'text-success', wide: true }
            ].map((sop, idx) => (
              <div key={idx} className={`glass-card p-8 rounded-2xl hover:border-primary/50 transition-all group ${sop.wide ? 'lg:col-span-2 md:flex items-center gap-8' : ''}`}>
                <div className={`w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center ${sop.color || 'text-primary'} mb-6 group-hover:scale-110 transition-transform shadow-inner shrink-0 ${sop.wide ? 'mb-0' : ''}`}>
                  <span className="material-icons-round text-2xl font-bold">{sop.icon}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-3 tracking-tight uppercase">{sop.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed font-medium">{sop.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Behind the Shield */}
      <section className="py-24 relative overflow-hidden bg-background-dark">
        <div className="absolute inset-0 grid-pattern opacity-10 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold mb-4 tracking-tight uppercase">The Tech Behind the <span className="text-primary italic">Shield</span></h2>
            <p className="text-white/60 max-w-2xl mx-auto font-medium leading-relaxed tracking-tight uppercase text-sm">Engineered for speed and precision. <br />SOP Scanner leverages institutional-grade infrastructure to protect every trade.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Real-time RPC Nodes', desc: 'Low-latency data fetching directly from Solana mainnet for sub-second analysis.', icon: 'dns', border: 'border-l-primary/40' },
              { title: 'ML Pattern Recognition', desc: 'Advanced algorithms to detect wash-trading and bot manipulation in real-time.', icon: 'psychology', border: 'border-l-secondary/40' },
              { title: 'Historical Rug Database', desc: 'Cross-referencing developer wallets against 100k+ known rug-pull signatures.', icon: 'database', border: 'border-l-purple-500/40' },
              { title: 'Instant Telegram Alerts', desc: 'Customizable push notifications for tokens that clear the 7-point SOP filter.', icon: 'send', border: 'border-l-blue-400/40' },
              { title: 'API Access for Developers', desc: 'Clean RESTful endpoints for integrating SOP scores into custom trading bots and external dashboards.', icon: 'api', border: 'border-l-success/40', wide: true, pill: 'STABLE v2' }
            ].map((tech, i) => (
              <div key={i} className={`tech-card ${tech.border} group ${tech.wide ? 'lg:col-span-2' : ''}`}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0 transition-transform group-hover:scale-110">
                    <span className="material-symbols-outlined font-bold">{tech.icon}</span>
                  </div>
                  <div className="w-full">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-lg font-bold group-hover:text-primary transition-colors tracking-tight uppercase">{tech.title}</h4>
                      {tech.pill && <span className="text-[10px] px-2 py-0.5 rounded bg-success/10 text-success border border-success/20 font-mono font-bold">{tech.pill}</span>}
                    </div>
                    <p className="text-sm text-white/40 leading-relaxed max-w-xl font-medium tracking-tight">{tech.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-background-dark">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <img src="/sop-logo.svg" alt="SOP Logo" className="w-8 h-8 rounded group-hover:scale-110 transition-transform" />
              <span className="font-display font-bold tracking-tight uppercase">SOP<span className="text-primary">SCANNER</span></span>
            </div>
            <div className="flex gap-8 text-white/40 text-[10px] font-black uppercase tracking-widest">
              <a className="hover:text-white transition-colors" href="#">Documentation</a>
              <a className="hover:text-white transition-colors" href="#">Twitter (X)</a>
              <a className="hover:text-white transition-colors" href="#">Telegram</a>
              <a className="hover:text-white transition-colors" href="#">Privacy Policy</a>
            </div>
            <div className="text-white/20 text-[9px] font-black uppercase tracking-[0.2em] font-mono">
              © 2024 SOP Scanner. Trading meme coins involves high risk.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

