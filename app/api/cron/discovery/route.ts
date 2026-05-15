import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { scanDEXScreener } from '@/lib/validators/dexscreener';
import { getDatabase } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MIN_DISCOVERY_LIQUIDITY = 20_000; // $20k minimum liquidity gate

/**
 * GET /api/cron/discovery
 * CRON A: Fallback token discovery. Skips execution when the Helius webhook
 * is active (detected by recent helius_webhook-sourced tokens in pending_tokens).
 * Triggered every 2 mins — becomes a no-op when webhook is healthy.
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

        const db = await getDatabase();

        // Skip if webhook has been active in the last 5 minutes
        const recentWebhookEvent = await db.collection('app_state').findOne({ key: 'helius_webhook_last_seen' });
        const isWebhookActive = recentWebhookEvent && (Date.now() - new Date(recentWebhookEvent.timestamp).getTime() < 5 * 60 * 1000);

        if (isWebhookActive) {
            return NextResponse.json({
                success: true,
                message: 'Webhook active — cron discovery skipped',
                skipped: true
            });
        }

        const minVolumeIncrease = Number(process.env.MIN_VOLUME_INCREASE_PERCENT) || 200;
        
        console.log('[Cron A] Webhook quiet — running fallback discovery scan...');
        const discoveredTokens = await scanDEXScreener(minVolumeIncrease);
        
        if (discoveredTokens.length === 0) {
            return NextResponse.json({ success: true, message: 'No new tokens discovered.' });
        }

        // Phase 4.2: minimum liquidity gate before queuing
        const filteredTokens = discoveredTokens.filter(t => (t.liquidity ?? 0) >= MIN_DISCOVERY_LIQUIDITY);
        console.log(`[Cron A] Filtered ${discoveredTokens.length - filteredTokens.length} tokens below $${MIN_DISCOVERY_LIQUIDITY} liquidity`);

        if (filteredTokens.length === 0) {
            return NextResponse.json({ success: true, message: 'All discovered tokens below liquidity gate.' });
        }

        const pendingTokensColl = db.collection('pending_tokens');
        
        const operations = filteredTokens.map(token => ({
            updateOne: {
                filter: { mint: token.mint },
                update: { 
                    $setOnInsert: { 
                        ...token, 
                        discoveredAt: new Date(),
                        processing: false,
                        source: 'cron_discovery'
                    } 
                },
                upsert: true
            }
        }));

        const result = await pendingTokensColl.bulkWrite(operations);

        console.log(`[Cron A] Discovered ${filteredTokens.length} tokens. Upserted ${result.upsertedCount}.`);

        return NextResponse.json({
            success: true,
            discovered: filteredTokens.length,
            upserted: result.upsertedCount,
            message: 'Discovery complete.'
        });

    } catch (error) {
        console.error('[Cron A] Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}

