import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { verifySolanaTransaction } from "@/lib/payments";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const { signature } = await request.json();
        if (!signature) {
            return NextResponse.json({ success: false, message: "Transaction signature is required" }, { status: 400 });
        }

        const userId = (session.user as any).id;
        const result = await verifySolanaTransaction(signature, userId);

        if (result.success) {
            return NextResponse.json({ success: true, message: result.message });
        } else {
            return NextResponse.json({ success: false, message: result.message }, { status: 400 });
        }

    } catch (error) {
        console.error("Payment API error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
