"use client"
import React, { useState } from 'react';
import Link from 'next/link';

// ─── Static Data ────────────────────────────────────────────────────────────

const TRUST_STATS = [
  { value: '10,000+', label: 'Tokens Scanned' },
  { value: '2,100+',  label: 'Active Traders' },
  { value: '48',      label: 'Alerts Today' },
  { value: '99.2%',   label: 'Accuracy Rate' },
];

const PARTNER_LOGOS = [
  { name: 'DEXScreener', icon: 'analytics' },
  { name: 'Helius',      icon: 'hub' },
  { name: 'Jupiter',     icon: 'swap_horiz' },
  { name: 'RugCheck',    icon: 'shield' },
];

const TIMELINE_STEPS = [
  { n: '01', icon: 'search',        title: 'Token Discovery',           desc: 'DEX data scanned for volume spikes and new pair launches in real-time.' },
  { n: '02', icon: 'filter_alt',    title: 'Fast Security Filter',      desc: 'Liquidity threshold and basic metadata sanity checks within milliseconds.' },
  { n: '03', icon: 'terminal',      title: 'Contract Analysis',         desc: 'Mint authority, freeze authority, and bytecode investigated for hidden functions.' },
  { n: '04', icon: 'bar_chart',     title: 'Pattern Detection',         desc: 'Wash-trading signatures and sybil clusters identified at transaction level.' },
  { n: '05', icon: 'groups',        title: 'Bundle Detection',          desc: 'Coordinated insider buy clusters at launch are flagged and scored.' },
  { n: '06', icon: 'psychology',    title: 'AI Narrative Analysis',     desc: 'Meme strength, social traction, and community authenticity evaluated by AI.' },
  { n: '07', icon: 'model_training','title': 'Sell Simulation',         desc: 'Exit trade simulated via Jupiter to detect honeypots before execution.' },
];

const SOP_FRAMEWORK = [
  { icon: 'terminal',      color: 'text-primary',   bg: 'bg-primary/10',   title: 'Contract Safety',         desc: 'Detect hidden mint or freeze authorities before the token even launches.' },
  { icon: 'layers',        color: 'text-primary',   bg: 'bg-primary/10',   title: 'Liquidity Depth',         desc: 'Ensure liquidity thresholds to prevent low-liquidity exit traps.' },
  { icon: 'trending_up',   color: 'text-primary',   bg: 'bg-primary/10',   title: 'Volume Authenticity',     desc: 'Filter wash-trading bots and fake activity from real market signals.' },
  { icon: 'groups',        color: 'text-secondary', bg: 'bg-secondary/10', title: 'Holder Distribution',     desc: 'Check whale concentration and supply control across wallets.' },
  { icon: 'radar',         color: 'text-secondary', bg: 'bg-secondary/10', title: 'Bundle Detection',        desc: 'Identify coordinated insider buy clusters at launch with sniper wallet tracking.' },
  { icon: 'psychology',    color: 'text-secondary', bg: 'bg-secondary/10', title: 'AI Narrative Intel',      desc: 'Analyse meme strength, organic social traction, and community authenticity.' },
  { icon: 'model_training',color: 'text-success',   bg: 'bg-success/10',   title: 'Sell Simulation',         desc: 'Simulate an exit trade to detect honeypots before you spend a single SOL.' },
];

const SIGNAL_FEED = [
  {
    token: '$DOGMOON', score: 94, safe: true,
    liq: '$240k', holders: '6%', status: 'Valid Setup',
    flags: [],
  },
  {
    token: '$PEPE_SOL', score: 98, safe: true,
    liq: '$180k', holders: '4%', status: 'Strong Buy',
    flags: [],
  },
  {
    token: '$PEPEPLUS', score: 22, safe: false,
    liq: '$18k', holders: '41%', status: 'High Risk',
    flags: ['Mint authority active', 'Suspicious bundle launch'],
  },
];

const PRICING_TIERS = [
  {
    name: 'Free', price: '$0', period: 'forever',
    desc: 'Explore the scanner.',
    features: ['5 scans / day', 'Basic safety score', 'Public signal feed', '21-day trial alerts'],
    cta: 'Get Started', href: '/register', pro: false,
  },
  {
    name: 'Pro', price: '$29', period: '/mo',
    desc: 'For serious traders.',
    badge: 'Most Popular',
    features: ['Unlimited scans', 'Full 7-point validation', 'Telegram alerts', 'AI narrative score', 'Smart wallet tracking', 'Priority support'],
    cta: 'Start Pro', href: '/subscribe', pro: true,
  },
  {
    name: 'Institutional', price: '$99', period: '/mo',
    desc: 'For builders and funds.',
    features: ['Everything in Pro', 'REST API access', 'Webhook signals', 'Custom dashboards', 'Higher rate limits', 'Dedicated onboarding'],
    cta: 'Contact Us', href: '/register', pro: false,
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function Home() {
  const [tokenInput, setTokenInput] = useState('');

  return (
    <div className="font-sans antialiased text-white bg-[#080808] selection:bg-primary/30 overflow-x-hidden">

      {/* ── NAVBAR ─────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 glass-nav">
        <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="material-icons-round text-primary text-xl">radar</span>
            </div>
            <span className="font-display text-xl font-bold tracking-tight">
              SOP<span className="text-primary">SCANNER</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-7 text-sm font-medium text-white/50">
            <a className="hover:text-white transition-colors" href="#how-it-works">How It Works</a>
            <a className="hover:text-white transition-colors" href="#framework">Framework</a>
            <a className="hover:text-white transition-colors" href="#pricing">Pricing</a>
            <a className="hover:text-white transition-colors" href="#api">API</a>
            <Link className="hover:text-white transition-colors" href="/login">Login</Link>
            <Link
              href="/register"
              className="px-5 py-2 bg-primary text-[#080808] font-bold rounded-full text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20"
            >
              Start Free Scan
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 circuit-bg opacity-20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#080808]/40 to-[#080808] pointer-events-none" />
        {/* Ambient orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/8 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 -right-32 w-80 h-80 bg-secondary/8 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[85vh] py-20">

            {/* Left: Messaging */}
            <div className="flex flex-col">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-8 w-fit">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                V1.0 Live · Real-Time Signals Active
              </div>

              <h1 className="font-display text-5xl md:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
                Scan Any Solana<br />
                Meme Coin{' '}
                <span className="shimmer-text">Before You Buy</span>
              </h1>

              <p className="text-lg text-white/55 leading-relaxed mb-10 max-w-xl">
                SOP Scanner runs a real-time <strong className="text-white/80">7-point security validation</strong> to
                detect honeypots, sniper bundles, hidden mint functions, and fake volume in seconds.
              </p>

              {/* Token Input */}
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <div className="flex-1 relative">
                  <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-lg">search</span>
                  <input
                    type="text"
                    value={tokenInput}
                    onChange={e => setTokenInput(e.target.value)}
                    placeholder="Paste token address…"
                    className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 hover:border-primary/30 focus:border-primary/50 focus:outline-none rounded-xl text-white placeholder:text-white/30 font-mono text-sm transition-all"
                  />
                </div>
                <Link
                  href={tokenInput ? `/dashboard?token=${tokenInput}` : '/dashboard'}
                  className="px-7 py-4 bg-primary text-[#080808] font-bold rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25 whitespace-nowrap"
                >
                  <span className="material-icons-round text-[20px]">radar</span>
                  Scan Token
                </Link>
              </div>

              <div className="flex items-center gap-6">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-sm font-semibold text-white/50 hover:text-primary transition-colors"
                >
                  View Live Signals
                  <span className="material-icons-round text-[16px]">arrow_forward</span>
                </Link>
                <span className="w-px h-4 bg-white/10" />
                <span className="text-xs text-white/30">No wallet needed to scan</span>
              </div>
            </div>

            {/* Right: Animated Scanner UI */}
            <div className="hidden lg:flex items-center justify-center relative">
              {/* Outer glow */}
              <div className="absolute inset-0 bg-primary/5 blur-[80px] rounded-full" />

              <div className="relative">
                {/* Scanner ring */}
                <div className="scanner-ring mx-auto" style={{ width: 360, height: 360 }}>
                  <div className="scanner-ring-inner gap-4 px-8 text-center">
                    {/* Pulse rings */}
                    <div className="scanner-pulse-ring" style={{ inset: '-20%', animationDelay: '0s', opacity: 0.3 }} />
                    <div className="scanner-pulse-ring" style={{ inset: '-40%', animationDelay: '1s', opacity: 0.15 }} />

                    {/* Score display */}
                    <div className="text-5xl font-black font-display text-success leading-none mb-1 animate-float">92</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-success/60 mb-4">SOP Score</div>

                    {/* Token info */}
                    <div className="w-full space-y-2 text-left px-2">
                      {[
                        { label: 'Token',    value: '$DOGMOON',  color: 'text-white' },
                        { label: 'Liq',      value: '$240k',     color: 'text-white' },
                        { label: 'Bundles',  value: 'None',      color: 'text-success' },
                        { label: 'Mint',     value: 'Disabled',  color: 'text-success' },
                        { label: 'Status',   value: 'Valid ✓',   color: 'text-success' },
                      ].map((row, i) => (
                        <div key={i} className="flex justify-between items-center text-[11px]">
                          <span className="text-white/30 font-mono">{row.label}</span>
                          <span className={`${row.color} font-bold font-mono`}>{row.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Scan bar */}
                    <div className="w-full mt-4 h-0.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '78%' }} />
                    </div>
                    <div className="text-[9px] text-primary/50 font-mono mt-1">SCANNING… 7/7 CHECKS</div>
                  </div>
                </div>

                {/* Floating badge — safe */}
                <div className="absolute -right-8 top-10 px-3 py-2 bg-success/10 border border-success/30 rounded-xl backdrop-blur-sm flex items-center gap-2 animate-float" style={{ animationDelay: '0.5s' }}>
                  <span className="w-2 h-2 rounded-full bg-success" />
                  <span className="text-success text-xs font-bold">Jupiter Sim: Pass</span>
                </div>

                {/* Floating badge — alert */}
                <div className="absolute -left-8 bottom-20 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-xl backdrop-blur-sm flex items-center gap-2 animate-float" style={{ animationDelay: '1.2s' }}>
                  <span className="material-icons-round text-red-400 text-sm">warning</span>
                  <span className="text-red-400 text-xs font-bold">Rug Blocked</span>
                </div>

                {/* Floating badge — whale */}
                <div className="absolute -right-6 bottom-10 px-3 py-2 bg-secondary/10 border border-secondary/30 rounded-xl backdrop-blur-sm flex items-center gap-2 animate-float" style={{ animationDelay: '0.8s' }}>
                  <span className="material-icons-round text-secondary text-sm">groups</span>
                  <span className="text-secondary text-xs font-bold">0 Bundles</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ──────────────────────────────────────────────────── */}
      <section className="border-y border-white/5 bg-white/[0.015] py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap justify-center md:justify-between items-center gap-8">
            {TRUST_STATS.map((s, i) => (
              <div key={i} className="text-center flex-1 min-w-[120px]">
                <div className="font-display text-3xl font-bold text-primary">{s.value}</div>
                <div className="text-xs text-white/40 uppercase tracking-widest font-semibold mt-1">{s.label}</div>
              </div>
            ))}
            <div className="h-px md:h-10 w-full md:w-px bg-white/10" />
            <div className="flex items-center gap-6 flex-wrap justify-center">
              {PARTNER_LOGOS.map((p, i) => (
                <div key={i} className="flex items-center gap-1.5 text-white/25 hover:text-white/50 transition-colors text-xs font-bold uppercase tracking-widest">
                  <span className="material-icons-round text-base">{p.icon}</span>
                  {p.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── THE PROBLEM ────────────────────────────────────────────────── */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-secondary/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <div className="section-label justify-center">
              <span className="material-icons-round text-base">warning</span>
              The Reality
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Most Meme Coin Traders Are <span className="text-red-400">Blind</span>
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              Charts show price. SOP Scanner shows <strong className="text-white/80">risk</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Without */}
            <div className="glass-card rounded-2xl p-8 border border-red-500/15 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-2xl rounded-full" />
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <span className="material-icons-round text-red-400 text-sm">block</span>
                </div>
                <span className="font-bold text-red-400 uppercase text-sm tracking-wider">Without SOP Scanner</span>
              </div>
              <div className="space-y-3 mb-8">
                {['Chart looks bullish', 'Volume is spiking', 'Twitter is hyping'].map((s, i) => (
                  <div key={i} className="flex items-center gap-3 text-white/60 text-sm">
                    <span className="material-icons-round text-white/20 text-base">radio_button_unchecked</span>
                    {s}
                  </div>
                ))}
              </div>
              <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                <div className="text-xs text-red-400/70 uppercase tracking-wider font-bold mb-2">Then you discover</div>
                <div className="space-y-1.5">
                  {['Hidden mint authority', 'Honeypot contract', 'Bundled insider launch', 'Fake wash-traded volume'].map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-red-400 text-sm font-semibold">
                      <span className="material-icons-round text-sm">close</span>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* With */}
            <div className="glass-card rounded-2xl p-8 border border-success/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 blur-2xl rounded-full" />
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                  <span className="material-icons-round text-success text-sm">verified</span>
                </div>
                <span className="font-bold text-success uppercase text-sm tracking-wider">With SOP Scanner</span>
              </div>
              <div className="space-y-3">
                {[
                  { icon: 'security',       label: 'Contract safety score', color: 'text-success' },
                  { icon: 'model_training', label: 'Sell simulation passed', color: 'text-success' },
                  { icon: 'groups',         label: 'Zero bundle wallets',   color: 'text-success' },
                  { icon: 'layers',         label: 'Liquidity verified',    color: 'text-success' },
                  { icon: 'psychology',     label: 'AI narrative score: 82',color: 'text-primary' },
                  { icon: 'trending_up',    label: 'Volume: Organic',       color: 'text-primary' },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-3 text-sm font-semibold ${item.color}`}>
                    <span className="material-icons-round text-base">{item.icon}</span>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────── */}
      <section className="py-28 bg-white/[0.02] relative" id="how-it-works">
        <div className="absolute inset-0 grid-pattern opacity-[0.04] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <div className="section-label justify-center">
              <span className="material-icons-round text-base">linear_scale</span>
              The Pipeline
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">How SOP Scanner Works</h2>
            <p className="text-white/50 max-w-lg mx-auto">
              Seven validation layers run in parallel, completing in under two seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-24 gap-y-0 max-w-5xl mx-auto">
            {TIMELINE_STEPS.map((step, i) => (
              <div
                key={i}
                className={`timeline-step pb-10 ${i % 2 === 0 ? '' : 'lg:mt-10'}`}
              >
                <div className="timeline-dot">{step.n}</div>
                <div className="glass-card-hover rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="material-icons-round text-primary text-lg">{step.icon}</span>
                    <h3 className="font-display font-bold text-white tracking-tight">{step.title}</h3>
                  </div>
                  <p className="text-sm text-white/45 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7-POINT SOP FRAMEWORK ─────────────────────────────────────── */}
      <section className="py-28 relative" id="framework">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/3 h-3/4 bg-primary/4 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
            <div>
              <div className="section-label">
                <span className="material-icons-round text-base">security</span>
                Institutional-Grade
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
                The 7-Point SOP<br />Validation Framework
              </h2>
            </div>
            <p className="text-white/40 max-w-xs text-sm leading-relaxed">
              Every token scanned is run through all seven layers simultaneously. No shortcuts taken.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {SOP_FRAMEWORK.map((sop, idx) => (
              <div
                key={idx}
                className={`glass-card rounded-2xl p-6 hover:border-white/20 transition-all duration-300 group cursor-default
                  ${idx === 6 ? 'lg:col-span-1 xl:col-span-1' : ''}`}
              >
                <div className={`w-11 h-11 rounded-xl ${sop.bg} flex items-center justify-center ${sop.color} mb-5 group-hover:scale-110 transition-transform shadow-inner`}>
                  <span className="material-icons-round">{sop.icon}</span>
                </div>
                <h3 className="font-bold text-white mb-2 tracking-tight">{sop.title}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{sop.desc}</p>
                <div className={`mt-4 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${sop.color} opacity-60`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  Active
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE SIGNAL FEED ───────────────────────────────────────────── */}
      <section className="py-28 bg-white/[0.015] relative" id="signals">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="section-label justify-center">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Live
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">Real-Time Signal Feed</h2>
            <p className="text-white/50">Every token auto-scanned. Every alert battle-tested. Zero noise.</p>
          </div>

          <div className="terminal-window">
            {/* Terminal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 bg-black/40">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <span className="font-mono text-xs text-white/40 font-bold ml-1">SOP ALPHA FEED • MAINNET</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-success">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                LIVE
              </div>
            </div>

            {/* Signals */}
            <div className="p-5 space-y-4 min-h-[340px]">
              {SIGNAL_FEED.map((sig, i) => (
                <div key={i} className={sig.safe ? 'signal-card-safe' : 'signal-card-rug'}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${sig.safe ? 'bg-primary/10' : 'bg-red-500/10'}`}>
                        <span className={`material-icons-round ${sig.safe ? 'text-primary' : 'text-red-400'}`}>
                          {sig.safe ? 'radar' : 'warning'}
                        </span>
                      </div>
                      <div>
                        <div className={`font-mono font-black text-lg leading-none mb-1 ${sig.safe ? 'text-white' : 'text-red-300'}`}>{sig.token}</div>
                        <div className={`text-xs font-bold uppercase tracking-wider ${sig.safe ? 'text-primary/70' : 'text-red-400/70'}`}>
                          {sig.safe ? 'SOP SCANNER ALERT' : 'RUG DETECTED'}
                        </div>
                      </div>
                    </div>
                    <div className={`text-right shrink-0`}>
                      <div className={`text-2xl font-black font-display leading-none ${sig.score >= 70 ? 'text-success' : 'text-red-400'}`}>{sig.score}</div>
                      <div className="text-[10px] text-white/30 uppercase font-bold">Score</div>
                    </div>
                  </div>

                  {sig.safe ? (
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      <div>
                        <div className="text-[10px] text-white/30 uppercase font-bold">Liquidity</div>
                        <div className="text-sm font-bold text-white">{sig.liq}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-white/30 uppercase font-bold">Top Holder</div>
                        <div className="text-sm font-bold text-success">{sig.holders}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-white/30 uppercase font-bold">Status</div>
                        <div className="text-sm font-bold text-success">{sig.status}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {sig.flags.map((f, fi) => (
                        <span key={fi} className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">{f}</span>
                      ))}
                    </div>
                  )}

                  {sig.safe && (
                    <Link
                      href="/dashboard"
                      className="mt-4 w-full py-2.5 rounded-xl bg-primary/8 hover:bg-primary/15 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                    >
                      View on Jupiter <span className="material-icons-round text-sm">open_in_new</span>
                    </Link>
                  )}
                </div>
              ))}
            </div>

            <div className="px-5 py-4 border-t border-white/8 flex items-center justify-between">
              <span className="text-xs text-white/25 font-mono">48 signals delivered today • auto-refreshing</span>
              <Link href="/dashboard" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                Open full feed <span className="material-icons-round text-sm">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SMART MONEY TRACKING ───────────────────────────────────────── */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-secondary/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="section-label">
                <span className="material-icons-round text-base">account_balance_wallet</span>
                Smart Money
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                Track the Wallets<br />That Move Markets
              </h2>
              <p className="text-white/50 text-lg mb-8 leading-relaxed">
                Follow the wallets that consistently find winners before the crowd. SOP Scanner
                monitors on-chain activity from elite traders and surfaces early entries in real time.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-10">
                {[
                  { icon: 'radar',             label: 'Monitor whale wallets' },
                  { icon: 'trending_up',        label: 'Track early buys' },
                  { icon: 'person_search',      label: 'Insider entry detection' },
                  { icon: 'sync_lock',          label: 'Coordinated trade alerts' },
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-white/60">
                    <span className={`material-icons-round text-primary text-base`}>{f.icon}</span>
                    {f.label}
                  </div>
                ))}
              </div>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-7 py-4 bg-secondary text-white font-bold rounded-xl hover:brightness-110 transition-all glow-purple-hover"
              >
                <span className="material-icons-round">rocket_launch</span>
                Start Tracking
              </Link>
            </div>

            {/* Wallet preview panel */}
            <div className="glass-card rounded-2xl overflow-hidden border border-secondary/15">
              <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-white/40 uppercase tracking-widest">Smart Wallets • Live</span>
                <span className="px-2 py-0.5 rounded bg-secondary/10 border border-secondary/20 text-secondary text-[10px] font-bold">52 TRACKED</span>
              </div>
              <div className="divide-y divide-white/5">
                {[
                  { wallet: '9xTk...gK2', token: '$DOGMOON', time: '2m ago',  change: '+480%', profit: true },
                  { wallet: 'Dkrf...9wQ', token: '$MEOW',    time: '7m ago',  change: '+210%', profit: true },
                  { wallet: '3pLx...bN1', token: '$FROG',    time: '14m ago', change: '+95%',  profit: true },
                  { wallet: '7mQz...rT5', token: '$BONK2',   time: '21m ago', change: '+330%', profit: true },
                ].map((w, i) => (
                  <div key={i} className="px-5 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary/15 flex items-center justify-center shrink-0">
                        <span className="material-icons-round text-secondary text-sm">account_circle</span>
                      </div>
                      <div>
                        <div className="font-mono text-xs text-white font-bold">{w.wallet}</div>
                        <div className="text-[10px] text-white/30 font-mono">Bought {w.token} · {w.time}</div>
                      </div>
                    </div>
                    <div className={`font-bold text-sm font-mono ${w.profit ? 'text-success' : 'text-red-400'}`}>{w.change}</div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-white/8 text-center">
                <Link href="/register" className="text-xs text-secondary font-bold hover:underline">View all 52 wallets →</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── AI ANALYSIS ────────────────────────────────────────────────── */}
      <section className="py-28 bg-white/[0.015] relative overflow-hidden">
        <div className="absolute left-1/2 -translate-x-1/2 top-0 w-2/3 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* AI panel */}
            <div className="glass-card rounded-2xl overflow-hidden border border-primary/15 order-2 lg:order-1">
              <div className="px-5 py-4 border-b border-white/8 flex items-center gap-3">
                <span className="material-icons-round text-primary">psychology</span>
                <span className="font-mono text-xs font-bold text-white/60 uppercase tracking-widest">AI Narrative Analysis · $DOGMOON</span>
              </div>
              <div className="p-6 space-y-5">
                {/* Scores */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Narrative Score', value: 82, color: 'bg-primary' },
                    { label: 'Hype Score',       value: 77, color: 'bg-secondary' },
                  ].map((s, i) => (
                    <div key={i} className="glass-card rounded-xl p-4">
                      <div className="text-3xl font-black font-display text-white mb-1">{s.value}</div>
                      <div className="text-[10px] text-white/40 uppercase font-bold mb-3">{s.label}</div>
                      <div className="w-full h-1 bg-white/8 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="p-4 bg-primary/5 border border-primary/15 rounded-xl">
                  <div className="text-[10px] text-primary font-bold uppercase tracking-widest mb-2">AI Summary</div>
                  <p className="text-sm text-white/60 leading-relaxed">
                    Strong meme potential with organic community growth signals detected across Telegram and X.
                    Early holder distribution is healthy. Narrative aligns with trending meta.
                  </p>
                </div>

                {/* Risks */}
                <div className="p-4 bg-yellow-500/5 border border-yellow-500/15 rounded-xl">
                  <div className="text-[10px] text-yellow-400 font-bold uppercase tracking-widest mb-2">Detected Risks</div>
                  <div className="space-y-1">
                    {['Liquidity still shallow at $42k', 'Whale accumulation in progress, watch for dump'].map((r, i) => (
                      <div key={i} className="flex items-start gap-2 text-yellow-400/80 text-xs">
                        <span className="material-icons-round text-xs mt-0.5">error_outline</span>
                        {r}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="section-label">
                <span className="material-icons-round text-base">psychology</span>
                AI Intelligence
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                AI-Powered Token<br />Intelligence
              </h2>
              <p className="text-white/50 text-lg mb-8 leading-relaxed">
                Beyond on-chain data. SOP Scanner's AI layer analyses narrative strength, social
                traction, community authenticity, and meta alignment to give you the full picture.
              </p>
              <div className="space-y-3">
                {[
                  'Meme strength & narrative scoring',
                  'Cross-platform social signal analysis',
                  'Organic vs. paid community detection',
                  'Meta alignment scoring per cycle',
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-3 text-white/60 text-sm">
                    <span className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    </span>
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DEVELOPER / API ────────────────────────────────────────────── */}
      <section className="py-28 relative overflow-hidden" id="api">
        <div className="absolute inset-0 grid-pattern opacity-[0.04] pointer-events-none" />
        <div className="absolute right-0 bottom-0 w-96 h-96 bg-success/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="section-label">
                <span className="material-icons-round text-base">api</span>
                Developer Access
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                Build On Top of<br />SOP Scanner
              </h2>
              <p className="text-white/50 text-lg mb-8 leading-relaxed">
                Integrate SOP scores directly into your trading bots, dashboards, or custom workflows
                via our stable REST API. Clean, fast, battle-tested.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-10">
                {[
                  { icon: 'api',          label: 'REST API',           pill: 'STABLE v2' },
                  { icon: 'webhook',      label: 'Webhook Signals',    pill: null },
                  { icon: 'smart_toy',    label: 'Bot Integration',    pill: null },
                  { icon: 'dashboard',    label: 'Custom Dashboards',  pill: null },
                  { icon: 'download',     label: 'CSV Exports',        pill: null },
                  { icon: 'bar_chart',    label: 'Higher Rate Limits', pill: 'Institutional' },
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm text-white/60">
                    <span className="material-icons-round text-success text-base">{f.icon}</span>
                    {f.label}
                    {f.pill && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-success/10 border border-success/20 text-success font-mono font-bold">{f.pill}</span>
                    )}
                  </div>
                ))}
              </div>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-7 py-4 bg-success/10 border border-success/30 text-success font-bold rounded-xl hover:bg-success/15 transition-all"
              >
                <span className="material-icons-round">code</span>
                Get API Access
              </Link>
            </div>

            {/* Code block */}
            <div className="terminal-window">
              <div className="px-5 py-3 border-b border-white/8 flex items-center justify-between bg-black/40">
                <span className="font-mono text-xs text-white/30">GET /api/scan/{'{tokenMint}'}</span>
                <span className="text-[10px] text-success font-bold font-mono">200 OK</span>
              </div>
              <div className="p-6 font-mono text-sm leading-7">
                <div className="text-white/20">{'{'}</div>
                <div className="pl-6">
                  <div><span className="text-secondary">"token"</span><span className="text-white/40">: </span><span className="text-success">"$DOGMOON"</span><span className="text-white/40">,</span></div>
                  <div><span className="text-secondary">"score"</span><span className="text-white/40">: </span><span className="text-primary">94</span><span className="text-white/40">,</span></div>
                  <div><span className="text-secondary">"risk"</span><span className="text-white/40">: </span><span className="text-success">"low"</span><span className="text-white/40">,</span></div>
                  <div><span className="text-secondary">"liquidity"</span><span className="text-white/40">: </span><span className="text-primary">240000</span><span className="text-white/40">,</span></div>
                  <div><span className="text-secondary">"bundle_detected"</span><span className="text-white/40">: </span><span className="text-success">false</span><span className="text-white/40">,</span></div>
                  <div><span className="text-secondary">"mint_authority"</span><span className="text-white/40">: </span><span className="text-success">null</span><span className="text-white/40">,</span></div>
                  <div><span className="text-secondary">"jupiter_sim"</span><span className="text-white/40">: </span><span className="text-success">"pass"</span><span className="text-white/40">,</span></div>
                  <div><span className="text-secondary">"ai_narrative"</span><span className="text-white/40">: </span><span className="text-primary">82</span><span className="text-white/40">,</span></div>
                  <div><span className="text-secondary">"timestamp"</span><span className="text-white/40">: </span><span className="text-white/50">"2026-04-01T14:29:22Z"</span></div>
                </div>
                <div className="text-white/20">{'}'}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ────────────────────────────────────────────────────── */}
      <section className="py-28 bg-white/[0.015] relative overflow-hidden" id="pricing">
        <div className="absolute left-1/2 -translate-x-1/2 top-0 w-2/3 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-14">
            <div className="section-label justify-center">
              <span className="material-icons-round text-base">credit_card</span>
              Pricing
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">Simple, Honest Pricing</h2>
            <p className="text-white/50">Start free. Upgrade when you're ready to trade seriously.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING_TIERS.map((tier, i) => (
              <div
                key={i}
                className={`pricing-card ${tier.pro ? 'pricing-card-pro' : ''} relative`}
              >
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-[#080808] text-[10px] font-black uppercase tracking-widest rounded-full whitespace-nowrap">
                    {tier.badge}
                  </div>
                )}
                <div className="mb-6">
                  <div className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1">{tier.name}</div>
                  <div className="flex items-end gap-1">
                    <span className="font-display text-4xl font-bold text-white">{tier.price}</span>
                    <span className="text-white/40 text-sm mb-1">{tier.period}</span>
                  </div>
                  <p className="text-white/40 text-sm mt-2">{tier.desc}</p>
                </div>

                <div className="flex-1 space-y-3 mb-8">
                  {tier.features.map((f, fi) => (
                    <div key={fi} className="flex items-center gap-3 text-sm text-white/65">
                      <span className={`material-icons-round text-base shrink-0 ${tier.pro ? 'text-primary' : 'text-success'}`}>check_circle</span>
                      {f}
                    </div>
                  ))}
                </div>

                <Link
                  href={tier.href}
                  className={`w-full py-3.5 rounded-xl font-bold text-center block transition-all
                    ${tier.pro
                      ? 'bg-primary text-[#080808] hover:brightness-110 shadow-lg shadow-primary/25'
                      : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                    }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>

          {/* Risk comparison strip */}
          <div className="mt-16 glass-card rounded-2xl p-8 border border-white/8">
            <div className="text-center mb-8">
              <h3 className="font-display text-xl font-bold text-white mb-1">The Numbers Don't Lie</h3>
              <p className="text-white/40 text-sm">Pro subscribers who scan before trading report significantly lower loss rates.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { label: 'Avg loss reduction', value: '-73%', color: 'text-success' },
                { label: 'Honeypots blocked',  value: '2,400+', color: 'text-primary' },
                { label: 'Rugs detected',      value: '98.4%',  color: 'text-primary' },
                { label: 'Scan speed',         value: '<2s',    color: 'text-secondary' },
              ].map((stat, i) => (
                <div key={i}>
                  <div className={`font-display text-3xl font-bold mb-1 ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-white/30 uppercase tracking-widest font-semibold">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────────────── */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 circuit-bg opacity-15 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#080808] via-transparent to-[#080808] pointer-events-none" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/8 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <div className="section-label justify-center mb-6">
            <span className="material-icons-round animate-pulse">security</span>
            Ready?
          </div>
          <h2 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
            Stop Trading <span className="text-red-400">Blind.</span>
          </h2>
          <p className="text-xl text-white/50 mb-12 leading-relaxed">
            Scan every Solana token before you buy.<br />
            In seconds. For free.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-10 py-4 bg-primary text-[#080808] font-black rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/30 text-lg"
            >
              <span className="material-icons-round">radar</span>
              Start Free Scan
            </Link>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-10 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2 text-lg"
            >
              View Live Signals
              <span className="material-icons-round text-lg">arrow_forward</span>
            </Link>
          </div>
          <p className="mt-8 text-sm text-white/25">No wallet required · Free tier forever · Cancel anytime</p>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="py-12 border-t border-white/5 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <span className="material-icons-round text-primary text-base">radar</span>
              </div>
              <span className="font-display font-bold tracking-tight">
                SOP<span className="text-primary">SCANNER</span>
              </span>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-white/30 text-xs font-bold uppercase tracking-widest">
              <a className="hover:text-white transition-colors" href="#">Docs</a>
              <a className="hover:text-white transition-colors" href="#api">API</a>
              <a className="hover:text-white transition-colors" href="#">Telegram</a>
              <a className="hover:text-white transition-colors" href="#">Twitter (X)</a>
              <a className="hover:text-white transition-colors" href="#">Privacy</a>
              <a className="hover:text-white transition-colors" href="#">Terms</a>
            </div>

            <div className="text-white/20 text-[9px] font-bold uppercase tracking-[0.2em] font-mono text-center md:text-right">
              © 2026 SOP Scanner<br />
              <span className="text-white/10">Trading meme coins involves high risk.</span>
            </div>
          </div>

          {/* Bottom disclaimer */}
          <div className="pt-6 border-t border-white/5 text-center">
            <p className="text-[10px] text-white/15 font-mono max-w-2xl mx-auto leading-relaxed">
              SOP Scanner provides security analysis tools for informational purposes only. Nothing on this platform constitutes financial advice.
              Always conduct your own research before trading. Past performance of any signal is not indicative of future results.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
