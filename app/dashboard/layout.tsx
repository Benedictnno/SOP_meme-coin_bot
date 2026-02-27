"use client"
import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { DashboardNav } from '@/components/dashboard/DashboardNav';
import { OnboardingTour } from '@/components/dashboard/OnboardingTour';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [subscriptionInfo, setSubscriptionInfo] = useState<{ expiry: string | null; trialDaysLeft: number }>({
        expiry: null,
        trialDaysLeft: 0,
    });
    const [showTour, setShowTour] = useState(false);
    const [existingTelegramId, setExistingTelegramId] = useState('');

    // Redirect if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    // Load subscription info + onboarding state
    useEffect(() => {
        const loadData = async () => {
            if (status !== 'authenticated') return;
            try {
                const res = await fetch('/api/user/settings');
                const data = await res.json();
                if (data.success) {
                    const createdAt = new Date(data.createdAt);
                    const trialExpiry = new Date(createdAt.getTime() + 21 * 24 * 60 * 60 * 1000);
                    const trialDaysLeft = Math.max(0, Math.ceil((trialExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                    setSubscriptionInfo({
                        expiry: data.subscriptionExpiresAt || null,
                        trialDaysLeft,
                    });
                    // Show tour for users who haven't completed it
                    if (!data.onboardingCompleted) {
                        // Small delay so the dashboard renders first
                        setTimeout(() => setShowTour(true), 800);
                    }
                    if (data.telegramChatId) {
                        setExistingTelegramId(data.telegramChatId);
                    }
                }
            } catch (err) {
                console.error('Failed to load layout data:', err);
            }
        };
        loadData();
    }, [status]);

    const handleTourComplete = async (telegramChatId: string) => {
        try {
            await fetch('/api/user/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ onboardingCompleted: true, telegramChatId }),
            });
        } catch (err) {
            console.error('Failed to mark onboarding complete:', err);
        }
        setShowTour(false);
    };

    const handleTourSkip = () => {
        setShowTour(false);
        // Don't mark as complete — tour will reappear on next login
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return null;
    }

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30">
            <DashboardNav
                session={session}
                subscriptionInfo={subscriptionInfo}
                onSignOut={() => signOut({ callbackUrl: '/login' })}
            />
            <div className="pb-24 md:pb-0">
                {children}
            </div>
            {showTour && (
                <OnboardingTour
                    onComplete={handleTourComplete}
                    onSkip={handleTourSkip}
                    existingTelegramId={existingTelegramId}
                />
            )}
        </div>
    );
}
