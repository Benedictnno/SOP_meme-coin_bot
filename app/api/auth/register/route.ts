import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByEmail, createUser } from "@/lib/users";
import { getDatabase } from "@/lib/mongodb";

function getClientIp(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    return request.headers.get('x-real-ip') || 'unknown';
}

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { success: false, message: "Email and password are required" },
                { status: 400 }
            );
        }

        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return NextResponse.json(
                { success: false, message: "User already exists" },
                { status: 400 }
            );
        }

        const clientIp = getClientIp(request);
        const db = await getDatabase();
        const now = new Date();

        // --- IP Abuse Check ---
        // Find any user from same IP whose free trial has already expired
        let trialDenied = false;
        if (clientIp !== 'unknown') {
            const trialPeriodMs = 21 * 24 * 60 * 60 * 1000;
            const existingFromIp = await db.collection('users').findOne({ signupIp: clientIp });
            if (existingFromIp) {
                const ipUserCreatedAt  = new Date(existingFromIp.createdAt);
                const ipUserTrialExpiry = new Date(ipUserCreatedAt.getTime() + trialPeriodMs);
                const hasExpiredTrial   = ipUserTrialExpiry < now && !existingFromIp.subscriptionExpiresAt;

                if (hasExpiredTrial) {
                    // Phase 5.2 — Soft signal only. Shared IPs (offices, universities) would
                    // produce false positives with a hard block. Log it and flag for manual
                    // review instead of denying registration outright.
                    console.log(`[AntiAbuse] Soft flag: IP ${clientIp} has prior expired account (${existingFromIp.email}). Allowing registration.`);
                    // trialDenied remains false — do NOT block the registration
                }
            }
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await createUser(email, hashedPassword, clientIp, trialDenied);

        return NextResponse.json({
            success: true,
            user: {
                id: user._id?.toString(),
                email: user.email
            }
        });

    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
