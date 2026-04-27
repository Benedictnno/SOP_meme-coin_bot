import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user || (session.user as any).role !== 'admin') {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const db = await getDatabase();

        // 1. Fetch Stats
        const totalUsers = await db.collection("users").countDocuments();
        const activeSubscribers = await db.collection("users").countDocuments({
            subscriptionExpiresAt: { $gt: new Date().toISOString() }
        });

        const payments = await db.collection("payments").find().toArray();
        const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

        // Fetch Tokens Scanned Stats
        const globalStats = await db.collection("system_stats").findOne({ _id: "global_stats" });
        const totalTokensScanned = globalStats?.totalTokensScanned || 0;

        // Fetch Valid Tokens Found (distinct mints in sent_alerts that are not 'convergence')
        const validTokensFound = (await db.collection("sent_alerts").distinct("mint", { type: { $ne: 'convergence' } })).length;

        // Fetch Queue Depth (tokens waiting for validation)
        const queueDepth = await db.collection("pending_tokens").countDocuments();

        // Fetch Recent Signals (last 5)
        const recentSignals = await db.collection("sent_alerts")
            .find({ type: { $ne: 'convergence' } })
            .sort({ timestamp: -1 })
            .limit(5)
            .toArray();

        // 2. Fetch Users
        const users = await db.collection("users")
            .find({}, { projection: { password: 0 } })
            .sort({ createdAt: -1 })
            .toArray();

        return NextResponse.json({
            success: true,
            stats: {
                totalUsers,
                activeSubscribers,
                totalRevenue,
                paymentCount: payments.length,
                totalTokensScanned,
                validTokensFound,
                queueDepth
            },
            recentSignals,
            users
        });

    } catch (error) {
        console.error("Admin API error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
