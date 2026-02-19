import React from 'react';
import { Search, Wallet, Shield, Play, Pause, Settings, X, LogOut } from 'lucide-react';
import Link from 'next/link';

interface BottomNavProps {
    session: any;
    isRunning: boolean;
    setIsRunning: (isRunning: boolean) => void;
    showSettings: boolean;
    setShowSettings: (showSettings: boolean) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
    session,
    isRunning,
    setIsRunning,
    showSettings,
    setShowSettings
}) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-t border-neutral-800 p-4 md:hidden flex justify-around items-center pb-6 safe-area-bottom">
            <Link href="/dashboard/search" className="flex flex-col items-center gap-1 text-neutral-400 hover:text-white transition-colors">
                <Search className="w-6 h-6" />
                <span className="text-[10px] font-bold uppercase tracking-wide">Search</span>
            </Link>

            <Link href="/dashboard/wallets" className="flex flex-col items-center gap-1 text-neutral-400 hover:text-white transition-colors">
                <Wallet className="w-6 h-6" />
                <span className="text-[10px] font-bold uppercase tracking-wide">Wallets</span>
            </Link>

            {session?.user?.role === 'admin' && (
                <Link href="/admin" className="flex flex-col items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors">
                    <Shield className="w-6 h-6" />
                    <span className="text-[10px] font-bold uppercase tracking-wide">Admin</span>
                </Link>
            )}

            <button
                onClick={() => setIsRunning(!isRunning)}
                className={`flex flex-col items-center gap-1 transition-colors ${isRunning ? 'text-red-500 hover:text-red-400' : 'text-green-500 hover:text-green-400'
                    }`}
            >
                {isRunning ? (
                    <>
                        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/50">
                            <X className="w-5 h-5 fill-current" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wide mt-1">Cancel</span>
                    </>
                ) : (
                    <>
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/50">
                            <Play className="w-5 h-5 fill-current pl-0.5" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wide mt-1">Init</span>
                    </>
                )}
            </button>

            <button
                onClick={() => setShowSettings(!showSettings)}
                className={`flex flex-col items-center gap-1 transition-colors ${showSettings ? 'text-purple-500' : 'text-neutral-400 hover:text-white'
                    }`}
            >
                <Settings className={`w-6 h-6 ${showSettings ? 'rotate-90' : ''} transition-transform duration-300`} />
                <span className="text-[10px] font-bold uppercase tracking-wide">Settings</span>
            </button>
        </div>
    );
};
