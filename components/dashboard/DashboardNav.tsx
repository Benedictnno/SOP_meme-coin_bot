"use client"
import React from 'react';
import { Zap, Search, Wallet, Shield, LogOut, Activity, Crown, Clock } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SubscriptionInfo {
    expiry: string | null;
    trialDaysLeft: number;
}

interface DashboardNavProps {
    session: any;
    subscriptionInfo: SubscriptionInfo;
    onSignOut: () => void;
}

export const DashboardNav: React.FC<DashboardNavProps> = ({
    session,
    subscriptionInfo,
    onSignOut
}) => {
    const pathname = usePathname();

    const navLinks = [
        { href: '/dashboard', label: 'Feed', icon: Activity },
        { href: '/dashboard/search', label: 'Search', icon: Search },
        { href: '/dashboard/wallets', label: 'Wallets', icon: Wallet },
    ];

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === '/dashboard';
        return pathname.startsWith(href);
    };

    // Determine subscription status
    const hasActiveSubscription = subscriptionInfo.expiry && new Date(subscriptionInfo.expiry) > new Date();
    const hasActiveTrial = !hasActiveSubscription && subscriptionInfo.trialDaysLeft > 0;
    const isExpired = !hasActiveSubscription && subscriptionInfo.trialDaysLeft <= 0;

    return (
        <>
            <nav className="border-b border-white/5 bg-[#0d0d0f]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    {/* Left: Logo */}
                    <div className="flex items-center gap-6">
                        <Link href="/dashboard" className="flex items-center space-x-3 group shrink-0">
                            <img src="/sop-logo.svg" alt="SOP Symbol" className="w-8 h-8 rounded-lg shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform ring-1 ring-white/20" />
                            <span className="hidden sm:inline font-['Space_Grotesk'] font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
                                Master the Trench
                            </span>
                        </Link>

                        {/* Subscription Badge */}
                        <Link
                            href="/subscribe"
                            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 ${hasActiveSubscription
                                ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                                : hasActiveTrial
                                    ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                                    : 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'
                                }`}
                        >
                            {hasActiveSubscription ? (
                                <>
                                    <Crown className="w-3 h-3" />
                                    <span>Pro Active</span>
                                </>
                            ) : hasActiveTrial ? (
                                <>
                                    <Clock className="w-3 h-3" />
                                    <span>Free Trial · {subscriptionInfo.trialDaysLeft} days</span>
                                </>
                            ) : (
                                <>
                                    <Zap className="w-3 h-3" />
                                    <span>Trial Expired</span>
                                </>
                            )}
                        </Link>
                    </div>

                    {/* Center: Nav Links */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                id={link.href === '/dashboard/search' ? 'tour-search-link' : link.href === '/dashboard/wallets' ? 'tour-wallets-link' : undefined}
                                className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${isActive(link.href)
                                    ? 'bg-purple-500/10 border border-purple-500/30 text-purple-400'
                                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <link.icon className="w-3.5 h-3.5" />
                                {link.label}
                            </Link>
                        ))}
                        {session?.user?.role === 'admin' && (
                            <Link
                                href="/admin"
                                className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${pathname.startsWith('/admin')
                                    ? 'bg-purple-500/10 border border-purple-500/30 text-purple-400'
                                    : 'text-purple-400/60 hover:text-purple-400 hover:bg-purple-500/5'
                                    }`}
                            >
                                <Shield className="w-3.5 h-3.5" />
                                Admin
                            </Link>
                        )}
                    </div>

                    {/* Right: User Actions */}
                    <div className="flex items-center gap-3">
                        {/* Mobile subscription badge */}
                        <Link
                            href="/subscribe"
                            className={`sm:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${hasActiveSubscription
                                ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                                : hasActiveTrial
                                    ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                                }`}
                        >
                            {hasActiveSubscription ? (
                                <Crown className="w-3 h-3" />
                            ) : hasActiveTrial ? (
                                <><Clock className="w-3 h-3" /><span>{subscriptionInfo.trialDaysLeft}d</span></>
                            ) : (
                                <Zap className="w-3 h-3" />
                            )}
                        </Link>

                        <button
                            onClick={onSignOut}
                            className="w-10 h-10 flex items-center justify-center rounded-full border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 transition-all"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Bottom Nav */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-t border-white/5 md:hidden safe-area-bottom">
                <div className="flex justify-around items-center py-2 pb-4">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${isActive(link.href)
                                ? 'text-purple-400'
                                : 'text-neutral-500 hover:text-white'
                                }`}
                        >
                            <link.icon className="w-5 h-5" />
                            <span className="text-[10px] font-bold uppercase tracking-wide">{link.label}</span>
                        </Link>
                    ))}
                    {session?.user?.role === 'admin' && (
                        <Link
                            href="/admin"
                            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${pathname.startsWith('/admin')
                                ? 'text-purple-400'
                                : 'text-neutral-500 hover:text-white'
                                }`}
                        >
                            <Shield className="w-5 h-5" />
                            <span className="text-[10px] font-bold uppercase tracking-wide">Admin</span>
                        </Link>
                    )}
                </div>
            </div>
        </>
    );
};
