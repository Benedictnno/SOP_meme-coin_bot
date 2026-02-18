import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getDatabase } from '@/lib/mongodb';
import { TrackedWallet } from '@/types';
import { ObjectId } from 'mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/wallets
 * List tracked wallets for the current user
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const db = await getDatabase();

        const wallets = await db.collection<TrackedWallet>('tracked_wallets')
            .find({ userId })
            .sort({ createdAt: -1 })
            .toArray();

        return NextResponse.json({ success: true, wallets });
    } catch (error) {
        console.error('List wallets error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * POST /api/wallets
 * Add a new wallet to track
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { address, label } = body;

        if (!address || address.length < 32) {
            return NextResponse.json({ success: false, error: 'Valid Solana address is required' }, { status: 400 });
        }

        const userId = (session.user as any).id;
        const db = await getDatabase();

        // Check if already tracking
        const existing = await db.collection<TrackedWallet>('tracked_wallets').findOne({ userId, address });
        if (existing) {
            return NextResponse.json({ success: false, error: 'Wallet already tracked' }, { status: 400 });
        }

        const newWallet: TrackedWallet = {
            userId,
            address,
            label: label || 'Unnamed Wallet',
            createdAt: new Date().toISOString()
        };

        await db.collection('tracked_wallets').insertOne(newWallet);

        return NextResponse.json({ success: true, wallet: newWallet });
    } catch (error) {
        console.error('Add wallet error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * DELETE /api/wallets
 * Remove a tracked wallet
 */
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const address = searchParams.get('address');

        if (!address) {
            return NextResponse.json({ success: false, error: 'Address is required' }, { status: 400 });
        }

        const userId = (session.user as any).id;
        const db = await getDatabase();

        const result = await db.collection('tracked_wallets').deleteOne({ userId, address });

        if (result.deletedCount === 0) {
            return NextResponse.json({ success: false, error: 'Wallet not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete wallet error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
