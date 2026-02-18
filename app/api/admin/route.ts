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
                paymentCount: payments.length
            },
            users
        });

    } catch (error) {
        console.error("Admin API error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
