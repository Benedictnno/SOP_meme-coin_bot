"use client"
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Zap, Check, ArrowRight, Loader2, Wallet } from 'lucide-react';

export default function SubscribePage() {
    const router = useRouter();
    const priceSol = process.env.NEXT_PUBLIC_SUBSCRIPTION_PRICE_SOL || '0.1';
    const [isVerifying, setIsVerifying] = useState(false);
    const [signature, setSignature] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!signature) return;

        setIsVerifying(true);
        setError('');

        try {
            const res = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ signature }),
            });

            const data = await res.json();

            if (data.success) {
                setSuccess(true);
                setTimeout(() => router.push('/dashboard'), 3000);
            } else {
                setError(data.message || 'Verification failed. Please ensure the transaction is confirmed.');
            }
        } catch (err) {
            setError('An error occurred during verification.');
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic">
                        Unlock <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">Pro Edge</span>
                    </h1>
                    <p className="text-neutral-500 text-lg font-bold uppercase tracking-widest max-w-2xl mx-auto">
                        Unlimited scanning. Real-time AI Intelligence. Institutional grade meme telemetry.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                    {/* Plan Card */}
                    <div className="border border-purple-500/30 bg-neutral-900/50 backdrop-blur-3xl rounded-3xl p-10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Zap className="w-32 h-32 text-purple-500" />
                        </div>

                        <div className="relative z-10">
                            <div className="px-4 py-1 bg-purple-500 text-[10px] font-black uppercase tracking-widest rounded-full w-fit mb-6">Unlimited Access</div>
                            <h2 className="text-3xl font-black mb-2 uppercase italic">Alpha Pass</h2>
                            <div className="flex items-baseline gap-2 mb-8">
                                <span className="text-5xl font-black tabular-nums">{priceSol}</span>
                                <span className="text-xl font-bold text-neutral-500 uppercase">SOL</span>
                                <span className="text-neutral-600 font-bold">/ MONTH</span>
                            </div>

                            <div className="space-y-4 mb-10">
                                {[
                                    'Unlimited Real-time Scans',
                                    'Advanced AI Narrative Analysis',
                                    'Priority Telegram Alerts',
                                    'Whale Wallet Tracking',
                                    'Contract Bundle Analysis',
                                    'Admin Mode Access'
                                ].map((feat, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span className="text-sm font-bold text-neutral-300 uppercase tracking-tight">{feat}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="p-6 bg-black/50 border border-neutral-800 rounded-2xl space-y-4">
                                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-neutral-500">
                                    <Wallet className="w-4 h-4" /> Transfer Recipient
                                </div>
                                <div className="bg-neutral-900 p-3 rounded font-mono text-[10px] break-all border border-neutral-800 text-purple-400">
                                    {process.env.NEXT_PUBLIC_PAYMENT_RECIPIENT || '3G8jExX... (Connect to view)'}
                                </div>
                                <p className="text-[10px] text-neutral-500 italic leading-relaxed">
                                    Send exactly {priceSol} SOL to the address above. Once the transaction is confirmed, paste the signature below to activate your account.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Verification Form */}
                    <div className="space-y-8 pt-10">
                        <div className="space-y-4">
                            <h3 className="text-xl font-black uppercase italic">Activate Subscription</h3>
                            <p className="text-neutral-500 text-sm font-medium leading-relaxed">
                                Already sent the SOL? Enter your transaction signature (TXID) below. Our system will verify the on-chain data and upgrade your account instantly.
                            </p>
                        </div>

                        {success ? (
                            <div className="p-12 border border-green-500/30 bg-green-500/5 rounded-3xl text-center space-y-4 animate-in zoom-in-95">
                                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto text-black">
                                    <Check className="w-8 h-8" />
                                </div>
                                <h4 className="text-2xl font-black uppercase italic text-green-400">Welcome to Pro</h4>
                                <p className="text-neutral-400 text-sm font-bold uppercase tracking-widest">Verification Successful. Redirecting...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleVerify} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] mb-3">Transaction Signature</label>
                                    <input
                                        type="text"
                                        value={signature}
                                        onChange={(e) => setSignature(e.target.value)}
                                        placeholder="Paste signature here..."
                                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-6 py-4 text-sm text-neutral-200 focus:border-purple-500/50 outline-none transition-all placeholder:text-neutral-700"
                                    />
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-xs font-bold uppercase tracking-tight">
                                        <Shield className="w-4 h-4" /> {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isVerifying || !signature}
                                    className="w-full py-5 bg-purple-600 hover:bg-purple-500 disabled:bg-neutral-800 disabled:text-neutral-600 text-white rounded-xl text-xs font-black uppercase tracking-[0.4em] transition-all shadow-2xl shadow-purple-600/30 flex items-center justify-center gap-3"
                                >
                                    {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                                    {isVerifying ? 'Verifying On-Chain...' : 'Activate Pro Membership'}
                                </button>
                            </form>
                        )}

                        <div className="pt-8 border-t border-neutral-800 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-neutral-600">
                            <div className="flex items-center gap-2 text-neutral-500"><Shield className="w-3 h-3" /> Secure Verification</div>
                            <div>Powered by Solana Mainnet-Beta</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
