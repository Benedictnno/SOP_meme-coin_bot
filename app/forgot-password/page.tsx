"use client";

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { Shield, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

function ForgotPasswordContent() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [devLink, setDevLink] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();

            if (!res.ok) {
                setStatus('error');
                setMessage(data.message || 'Failed to request reset link.');
            } else {
                setStatus('success');
                setMessage(data.message || 'If an account exists, a reset link was sent.');
                if (data.devLink) setDevLink(data.devLink);
            }
        } catch (err) {
            setStatus('error');
            setMessage('Network error. Please try again.');
        }
    };

    return (
        <div className="w-full max-w-md relative z-10">
            <div className="flex flex-col items-center mb-10">
                <img src="/sop-logo.svg" alt="SOP Logo" className="w-16 h-16 rounded-2xl shadow-2xl mb-6 border border-neutral-800" />
                <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Reset Password</h1>
                <p className="text-neutral-500 text-sm font-medium text-center">Enter your email and we'll send you a link to reset your password.</p>
            </div>

            <div className="bg-neutral-900/50 border border-neutral-800/50 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">
                {status === 'success' ? (
                    <div className="space-y-6">
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm font-bold flex flex-col items-center gap-3 text-center">
                            <CheckCircle2 className="w-8 h-8 mb-2" />
                            {message}
                        </div>

                        {devLink && (
                            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                                <p className="text-xs text-purple-400 mb-2 font-bold uppercase tracking-wider text-center">Dev Mode Link</p>
                                <a href={devLink} className="text-xs text-purple-300 break-all hover:underline text-center w-full block">
                                    {devLink}
                                </a>
                            </div>
                        )}

                        <div className="pt-4 border-t border-neutral-800/50 flex justify-center">
                            <Link href="/login" className="text-blue-400 font-bold hover:text-blue-300 transition-colors text-sm flex items-center gap-2 group">
                                Back to Sign in <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {status === 'error' && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold uppercase tracking-wider text-center">
                                {message}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-200 focus:border-blue-500/50 outline-none transition-all"
                                placeholder="name@company.com"
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
                                    Send Reset Link <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                )}

                <div className="mt-8 pt-8 border-t border-neutral-800/50 flex flex-col items-center gap-4">
                    <p className="text-xs text-neutral-500">
                        Remember your password?{' '}
                        <Link href="/login" className="text-blue-400 font-bold hover:text-blue-300 transition-colors">
                            Sign In
                        </Link>
                    </p>
                </div>
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

export default function ForgotPasswordPage() {
    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

            <Suspense fallback={
                <div className="w-full max-w-md flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            }>
                <ForgotPasswordContent />
            </Suspense>
        </div>
    );
}
