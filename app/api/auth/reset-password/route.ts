import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
    try {
        const { email, token, newPassword } = await request.json();

        if (!email || !token || !newPassword) {
            return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ success: false, message: "Password must be at least 6 characters" }, { status: 400 });
        }

        const db = await getDatabase();
        
        // Find valid token
        const resetRecord = await db.collection('password_resets').findOne({
            email,
            token,
            expiresAt: { $gt: new Date() }
        });

        if (!resetRecord) {
            return NextResponse.json({ success: false, message: "Invalid or expired reset token" }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update user
        const result = await db.collection('users').updateOne(
            { email },
            { $set: { password: hashedPassword } }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        // Delete used token
        await db.collection('password_resets').deleteOne({ _id: resetRecord._id });

        return NextResponse.json({ 
            success: true, 
            message: "Password reset successful"
        });

    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
