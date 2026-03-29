import { NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/users";
import { getDatabase } from "@/lib/mongodb";
import crypto from "crypto";

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 });
        }

        const user = await getUserByEmail(email);
        if (!user) {
            // Return success even if user doesn't exist to prevent enum attacks
            return NextResponse.json({ success: true, message: "If an account exists, a reset link was generated." });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour expiration

        const db = await getDatabase();
        
        // Remove existing tokens
        await db.collection('password_resets').deleteMany({ email });
        
        // Save new token
        await db.collection('password_resets').insertOne({
            email,
            token,
            expiresAt
        });

        // In a real application, send an email here using SendGrid/Resend/AWS SES
        const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
        
        console.log(`\n\n==============================================`);
        console.log(`🔐 PASSWORD RESET LINK (MOCK EMAIL)`);
        console.log(`To: ${email}`);
        console.log(`Link: ${resetLink}`);
        console.log(`==============================================\n\n`);

        return NextResponse.json({ 
            success: true, 
            message: "Password reset link has been dispatched.",
            // In dev mode, we could return the link, but it's printed to server console
            devLink: process.env.NODE_ENV !== 'production' ? resetLink : undefined
        });

    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
