import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MIN_DISCOVERY_LIQUIDITY = 20_000; // $20k minimum at discovery time

/**
 * POST /api/webhooks/helius-discovery
 * Receives real-time token creation and swap events from Helius.
 * This replaces cron-based discovery as the primary ingestion mechanism.
 *
 * Setup in Helius Dashboard:
 *   1. Go to https://dev.helius.xyz/webhooks
 *   2. Create webhook pointing to: https://yourdomain.com/api/webhooks/helius-discovery
 *   3. Subscribe to: TOKEN_MINT, SWAP
 *   4. Add your HELIUS_WEBHOOK_SECRET to .env.local
 */
export async function POST(request: NextRequest) {
    // Verify this is from Helius
    const secret = request.headers.get('authorization');
    if (
        process.env.HELIUS_WEBHOOK_SECRET &&
        secret !== `Bearer ${process.env.HELIUS_WEBHOOK_SECRET}`
    ) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let payload: any[];
    try {
        payload = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    if (!Array.isArray(payload) || payload.length === 0) {
        return NextResponse.json({ ok: true, queued: 0 });
    }

    const db = await getDatabase();
    const pendingTokensColl = db.collection('pending_tokens');

    const newMints: string[] = [];

    for (const event of payload) {
        let tokenMint: string | null = null;

        if (event.type === 'TOKEN_MINT') {
            tokenMint = event.mint || event.tokenMint || null;
        } else if (event.type === 'SWAP') {
            const swap = event.events?.swap;
            if (swap) {
                const allTokens = [
                    ...(swap.tokenInputs  || []),
                    ...(swap.tokenOutputs || [])
                ];
                const target = allTokens.find((t: any) =>
                    t.mint !== 'So11111111111111111111111111111111111111112' &&
                    t.mint !== 'So11111111111111111111111111111111111111111'
                );
                tokenMint = target?.mint ?? null;
            }
        }

        if (!tokenMint) continue;

        // Dedup: skip if already in pipeline or recently alerted (24h)
        const alreadyQueued = await pendingTokensColl.findOne({ mint: tokenMint });
        if (alreadyQueued) continue;

        const recentAlert = await db.collection('sent_alerts').findOne({
            mint: tokenMint,
            timestamp: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });
        if (recentAlert) continue;

        newMints.push(tokenMint);
    }

    if (newMints.length === 0) {
        return NextResponse.json({ ok: true, queued: 0 });
    }

    // Fetch DexScreener data for new mints in one batch
    const { getTokenDetails } = await import('@/lib/validators/dexscreener');

    const tokenResults = await Promise.allSettled(
        newMints.map(async (mint) => {
            const token = await getTokenDetails(mint);
            if (!token) return null;
            return {
                ...token,
                discoveredAt: new Date(),
                processing: false,
                source: 'helius_webhook'
            };
        })
    );

    const validDocs = tokenResults
        .filter((r): r is PromiseFulfilledResult<any> =>
            r.status === 'fulfilled' && r.value !== null
        )
        .map(r => r.value)
        // Phase 4.2: minimum liquidity gate at discovery time
        .filter(doc => (doc.liquidity ?? 0) >= MIN_DISCOVERY_LIQUIDITY);

    if (validDocs.length > 0) {
        const ops = validDocs.map((doc: any) => ({
            updateOne: {
                filter: { mint: doc.mint },
                update: { $setOnInsert: doc },
                upsert: true
            }
        }));
        await pendingTokensColl.bulkWrite(ops);
        console.log(`[Helius Discovery] Queued ${validDocs.length} new tokens for validation`);
    }

    return NextResponse.json({ ok: true, queued: validDocs.length });
}
