import React from 'react';
import { Zap, Clock, Search, Wallet, Shield, Pause, Play, Settings, X, LogOut } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
    session: any;
    isRunning: boolean;
    setIsRunning: (isRunning: boolean) => void;
    showSettings: boolean;
    setShowSettings: (showSettings: boolean) => void;
    lastScanTime: Date | null;
    onClearData: () => void;
    onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
    session,
    isRunning,
    setIsRunning,
    showSettings,
    setShowSettings,
    lastScanTime,
    onClearData,
    onSignOut
}) => {
    return (
        <header className="flex flex-row items-center justify-between gap-6 mb-12">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <Zap className="w-6 h-6 text-white fill-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-black tracking-tighter uppercase italic leading-none mb-1">
                        MemeScanner <span className="text-purple-500">v3.0</span>
                    </h1>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 hidden md:inline-block">Neural Intelligence Terminal</span>
                        {/* Mobile only title suffix or just hide the subtitle on very small screens if needed */}
                        {lastScanTime && (
                            <span className="text-[10px] text-neutral-700 font-bold uppercase tracking-widest flex items-center gap-1">
                                <Clock className="w-3 h-3" /> <span className="hidden md:inline">Sync:</span> {lastScanTime.toLocaleTimeString()}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-3">
                    <Link href="/search" className="px-4 py-2 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white hover:border-purple-500/50 transition-all font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                        <Search className="w-3.5 h-3.5" /> Search
                    </Link>
                    <Link href="/wallets" className="px-4 py-2 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white hover:border-purple-500/50 transition-all font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                        <Wallet className="w-3.5 h-3.5" /> Wallets
                    </Link>
                    {session?.user?.role === 'admin' && (
                        <Link href="/admin" className="px-4 py-2 rounded-lg border border-purple-500/30 bg-purple-500/5 text-purple-400 hover:text-purple-300 hover:border-purple-500/50 transition-all font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5" /> Admin Panel
                        </Link>
                    )}
                    <button
                        onClick={() => setIsRunning(!isRunning)}
                        className={`px-8 py-3 rounded-full flex items-center gap-3 transition-all font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl ${isRunning
                            ? 'bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20'
                            : 'bg-purple-600 text-white hover:bg-purple-500 shadow-purple-600/20'
                            }`}
                    >
                        {isRunning ? <><Pause className="w-4 h-4 fill-current" /> Terminate Node</> : <><Play className="w-4 h-4 fill-current" /> Initialize Node</>}
                    </button>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="w-12 h-12 flex items-center justify-center rounded-full border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 transition-all"
                    >
                        <Settings className={`w-5 h-5 ${showSettings ? 'rotate-90 text-purple-500' : ''} transition-all`} />
                    </button>
                    <button
                        onClick={onClearData}
                        className="w-12 h-12 flex items-center justify-center rounded-full border border-neutral-800 text-neutral-400 hover:text-red-500 transition-all"
                        title="Clear All Data"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <button
                    onClick={onSignOut}
                    className="w-12 h-12 flex items-center justify-center rounded-full border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 transition-all"
                    title="Logout"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
};
