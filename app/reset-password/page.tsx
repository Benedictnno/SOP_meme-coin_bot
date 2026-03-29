"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Shield, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

function ResetPasswordContent() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    useEffect(() => {
        if (!token || !email) {
            setStatus('error');
            setMessage('Invalid or missing reset token.');
        }
    }, [token, email]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setStatus('error');
            setMessage('Passwords do not match.');
            return;
        }

        if (password.length < 6) {
            setStatus('error');
            setMessage('Password must be at least 6 characters.');
            return;
        }

        setStatus('loading');
        setMessage('');

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, token, newPassword: password })
            });
            const data = await res.json();

            if (!res.ok) {
                setStatus('error');
                setMessage(data.message || 'Failed to reset password.');
            } else {
                setStatus('success');
                setMessage('Your password has been successfully reset.');
                
                // Redirect user to login after 3 seconds
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            }
        } catch (err) {
            setStatus('error');
            setMessage('Network error. Please try again.');
        }
    };

    if (status === 'error' && (!token || !email)) {
        return (
            <div className="w-full max-w-md relative z-10 flex flex-col items-center">
                <div className="bg-neutral-900/50 border border-neutral-800/50 backdrop-blur-xl rounded-3xl p-8 shadow-2xl w-full text-center space-y-4">
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold uppercase tracking-wider text-center">
                        Invalid Reset Link
                    </div>
                    <p className="text-sm text-neutral-400">Your link may have expired or is missing required parameters.</p>
                    <Link href="/forgot-password" className="text-blue-400 font-bold hover:text-blue-300 transition-colors block mt-4 text-sm">
                        Request New Link
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md relative z-10">
            <div className="flex flex-col items-center mb-10">
                <img src="/sop-logo.svg" alt="SOP Logo" className="w-16 h-16 rounded-2xl shadow-2xl mb-6 border border-neutral-800" />
                <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Create New Password</h1>
                <p className="text-neutral-500 text-sm font-medium text-center">Enter your new password below.</p>
            </div>

            <div className="bg-neutral-900/50 border border-neutral-800/50 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">
                {status === 'success' ? (
                    <div className="space-y-6">
                        <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm font-bold flex flex-col items-center gap-3 text-center">
                            <CheckCircle2 className="w-8 h-8 mb-2" />
                            {message}
                        </div>
                        <p className="text-xs text-neutral-500 text-center">Redirecting you to login...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {status === 'error' && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold uppercase tracking-wider text-center">
                                {message}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">New Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-200 focus:border-blue-500/50 outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Confirm Password</label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-200 focus:border-blue-500/50 outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 group"
                        >
                            {status === 'loading' ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Save New Password <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>

            <div className="mt-10 flex items-center justify-center gap-6">
                <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-neutral-950 bg-neutral-800" />
                    ))}
                </div>
                <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">
                    Secured by <span className="text-neutral-400">SOP</span>
                </p>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

            <Suspense fallback={
                <div className="w-full max-w-md flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            }>
                <ResetPasswordContent />
            </Suspense>
        </div>
    );
}
