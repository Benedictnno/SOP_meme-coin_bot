import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const db = await getDatabase();
        const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            settings: user.settings,
            telegramChatId: user.telegramChatId,
            subscriptionExpiresAt: user.subscriptionExpiresAt,
            createdAt: user.createdAt,
            onboardingCompleted: user.onboardingCompleted ?? false,
            trialDenied: user.trialDenied ?? false
        });

    } catch (error) {
        console.error("Fetch settings error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const { settings, telegramChatId, onboardingCompleted } = await request.json();

        const db = await getDatabase();

        // --- Telegram Chat ID Uniqueness Check ---
        if (telegramChatId) {
            const now = new Date();
            const trialPeriodMs = 21 * 24 * 60 * 60 * 1000;
            const existing = await db.collection('users').findOne({
                telegramChatId,
                _id: { $ne: new ObjectId(userId) } // not this user
            });
            if (existing) {
                const existingCreatedAt = new Date(existing.createdAt);
                const existingTrialExpiry = new Date(existingCreatedAt.getTime() + trialPeriodMs);
                const isExpired = existingTrialExpiry < now && !existing.subscriptionExpiresAt;
                if (isExpired) {
                    return NextResponse.json({
                        success: false,
                        message: 'This Telegram account is already linked to another SOP account.'
                    }, { status: 400 });
                }
            }
        }

        const updateData: any = {};
        if (settings) updateData.settings = settings;
        if (telegramChatId) updateData.telegramChatId = telegramChatId;
        if (onboardingCompleted !== undefined) updateData.onboardingCompleted = onboardingCompleted;

        await db.collection("users").updateOne(
            { _id: new ObjectId(userId) },
            { $set: updateData }
        );

        return NextResponse.json({ success: true, message: "Settings updated successfully" });

    } catch (error) {
        console.error("Update settings error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
