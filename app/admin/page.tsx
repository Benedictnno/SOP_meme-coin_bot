"use client"
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Users, DollarSign, Shield, Activity, Search, Trash2, Calendar, CheckCircle, XCircle, ChevronRight, BarChart3, Loader2 } from 'lucide-react';

interface Stats {
    totalUsers: number;
    activeSubscribers: number;
    totalRevenue: number;
    paymentCount: number;
}

interface User {
    _id: string;
    email: string;
    role: string;
    createdAt: string;
    subscriptionExpiresAt?: string;
    telegramChatId?: string;
}

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [stats, setStats] = useState<Stats | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (status === 'unauthenticated' || (status === 'authenticated' && (session.user as any).role !== 'admin')) {
            router.push('/dashboard');
        }
    }, [status, session, router]);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/admin');
            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
                setUsers(data.users);
            }
        } catch (err) {
            console.error('Admin fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (status === 'authenticated' && (session.user as any).role === 'admin') {
            fetchData();
        }
    }, [status, session]);

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.telegramChatId?.includes(search)
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-4" />
                <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Authorizing Admin Access...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-200 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">System Control</h1>
                        <p className="text-xs text-neutral-500 font-bold uppercase tracking-[0.2em] mt-1">Admin Oversight Console</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl">
                        <div className="flex justify-between items-start mb-4">
                            <Users className="w-5 h-5 text-purple-500" />
                            <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Total Fleet</span>
                        </div>
                        <div className="text-3xl font-bold tabular-nums">{stats?.totalUsers || 0}</div>
                        <p className="text-xs text-neutral-500 mt-1">Registered accounts</p>
                    </div>
                    <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl">
                        <div className="flex justify-between items-start mb-4">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Premium</span>
                        </div>
                        <div className="text-3xl font-bold tabular-nums">{stats?.activeSubscribers || 0}</div>
                        <p className="text-xs text-neutral-500 mt-1">Active subscriptions</p>
                    </div>
                    <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl">
                        <div className="flex justify-between items-start mb-4">
                            <DollarSign className="w-5 h-5 text-blue-500" />
                            <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Revenue</span>
                        </div>
                        <div className="text-3xl font-bold tabular-nums">{stats?.totalRevenue.toFixed(2) || 0} SOL</div>
                        <p className="text-xs text-neutral-500 mt-1">Lifetime earnings</p>
                    </div>
                    <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl">
                        <div className="flex justify-between items-start mb-4">
                            <Activity className="w-5 h-5 text-orange-500" />
                            <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Growth</span>
                        </div>
                        <div className="text-3xl font-bold tabular-nums">{Math.round(((stats?.activeSubscribers || 0) / (stats?.totalUsers || 1)) * 100)}%</div>
                        <p className="text-xs text-neutral-500 mt-1">Conversion rate</p>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-400">User Management</h2>
                        <div className="relative">
                            <Search className="w-4 h-4 text-neutral-600 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search by email or TG..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="bg-neutral-950 border border-neutral-800 rounded-lg pl-10 pr-4 py-2 text-xs outline-none focus:border-purple-500/50 w-64 transition-all"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-800 text-[9px] font-black text-neutral-600 uppercase tracking-widest">
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Created</th>
                                    <th className="px-6 py-4">Subscription</th>
                                    <th className="px-6 py-4">Telegram</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800/50">
                                {filteredUsers.map(user => {
                                    const isPremium = user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > new Date();
                                    return (
                                        <tr key={user._id} className="hover:bg-neutral-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-bold text-neutral-200">{user.email}</div>
                                                <div className="text-[10px] text-neutral-500 font-mono mt-0.5">{user._id}</div>
                                            </td>
                                            <td className="px-6 py-4 text-[11px] text-neutral-400 font-medium tabular-nums">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                {isPremium ? (
                                                    <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-500 text-[9px] font-black uppercase rounded-full">Active</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 bg-neutral-800 border border-neutral-700 text-neutral-500 text-[9px] font-black uppercase rounded-full">Inactive</span>
                                                )}
                                                <div className="text-[9px] text-neutral-600 font-bold mt-1 tabular-nums">
                                                    {user.subscriptionExpiresAt ? `Expires: ${new Date(user.subscriptionExpiresAt).toLocaleDateString()}` : 'No subscription data'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-[11px] text-neutral-400 font-medium font-mono">
                                                    {user.telegramChatId || 'Not linked'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-600 hover:text-red-400 transition-all">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
