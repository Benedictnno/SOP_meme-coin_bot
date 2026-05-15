import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getDatabase } from '@/lib/mongodb';
import { createEnhancedAlert } from '@/lib/validation-utils';
import { BotSettings } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/validate
 * CRON B: Validates top pending tokens and writes results to delivery_queue.
 * User fan-out (Telegram sends) has been moved to /api/cron/notify.
 * Triggered every 1 minute via Vercel cron.
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const isAdmin = session?.user && (session.user as any).role === 'admin';

        const authHeader = request.headers.get('authorization');
        const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

        if (authHeader !== expectedAuth && !isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const startTime = Date.now();
        const db = await getDatabase();
        const pendingTokensColl = db.collection('pending_tokens');

        // Fetch top 5 pending tokens, ordered by highest volume increase
        const tokensToProcess = await pendingTokensColl
            .find({ processing: false })
            .sort({ volumeIncrease: -1 })
            .limit(5)
            .toArray();

        if (tokensToProcess.length === 0) {
            return NextResponse.json({ success: true, message: 'No pending tokens to validate.' });
        }

        // Mark as processing immediately to prevent parallel cron overlap
        const tokenMints = tokensToProcess.map(t => t.mint);
        await pendingTokensColl.updateMany(
            { mint: { $in: tokenMints } },
            { $set: { processing: true } }
        );

        const masterSettings: BotSettings = {
            minLiquidity: Number(process.env.MIN_LIQUIDITY_USD) || 50000,
            maxTopHolderPercent: Number(process.env.MAX_TOP_HOLDER_PERCENT) || 10,
            minVolumeIncrease: Number(process.env.MIN_VOLUME_INCREASE_PERCENT) || 200,
            scanInterval: Number(process.env.SCAN_INTERVAL_SECONDS) || 60,
            enableTelegramAlerts: true,
            aiMode: 'balanced'
        };

        const validatedMints: string[] = [];
        let validCount = 0;

        // Execute serially (concurrency=1) to prevent RPC flooding.
        for (const token of tokensToProcess as any[]) {
            const tokenData = { ...token };
            delete tokenData._id;
            delete tokenData.discoveredAt;
            delete tokenData.processing;
            delete tokenData.source;

            try {
                // skipBundleDetector=true — bundle detection (200 RPC calls) is not needed here
                const alert = await createEnhancedAlert(tokenData, masterSettings, true);

                // createEnhancedAlert writes to signals + delivery_queue when valid & score >= 30
                if (alert.isValid && alert.compositeScore >= 30) {
                    validCount++;
                }

                validatedMints.push(token.mint);
            } catch (err) {
                console.error(`[Cron B] Error validating ${token.symbol}:`, err);
                validatedMints.push(token.mint); // Remove from queue even on failure to unblock pipeline
            }
        }

        // Cleanup processed tokens from pending queue
        await pendingTokensColl.deleteMany({ mint: { $in: validatedMints } });

        // Update global stats
        if (validatedMints.length > 0) {
            await db.collection('system_stats').updateOne(
                { _id: 'global_stats' as any },
                { $inc: { totalTokensScanned: validatedMints.length } },
                { upsert: true }
            );
        }

        return NextResponse.json({
            success: true,
            processed: tokensToProcess.length,
            valid: validCount,
            executionTime: `${Date.now() - startTime}ms`,
            message: 'Validation complete.'
        });

    } catch (error) {
        console.error('[Cron B] Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
