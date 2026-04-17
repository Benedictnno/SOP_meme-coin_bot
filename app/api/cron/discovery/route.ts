import { NextRequest, NextResponse } from 'next/server';
import { scanDEXScreener } from '@/lib/validators/dexscreener';
import { getDatabase } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/discovery
 * CRON A: Fast token discovery. Unblocks execution time.
 * Fetch newly minted tokens with high volume and stores them in pending_tokens.
 * Triggered every 2 mins.
 */
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

        if (authHeader !== expectedAuth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const minVolumeIncrease = Number(process.env.MIN_VOLUME_INCREASE_PERCENT) || 200;
        
        console.log('[Cron A] Starting discovery scan...');
        const discoveredTokens = await scanDEXScreener(minVolumeIncrease);
        
        if (discoveredTokens.length === 0) {
            return NextResponse.json({ success: true, message: 'No new tokens discovered.' });
        }

        const db = await getDatabase();
        
        // Prepare for bulk insert
        const pendingTokensColl = db.collection('pending_tokens');
        
        const operations = discoveredTokens.map(token => ({
            updateOne: {
                filter: { mint: token.mint },
                update: { 
                    $setOnInsert: { 
                        ...token, 
                        discoveredAt: new Date(),
                        processing: false 
                    } 
                },
                upsert: true
            }
        }));

        const result = await pendingTokensColl.bulkWrite(operations);

        console.log(`[Cron A] Discovered ${discoveredTokens.length} tokens. Upserted ${result.upsertedCount}.`);

        return NextResponse.json({
            success: true,
            discovered: discoveredTokens.length,
            upserted: result.upsertedCount,
            message: 'Discovery complete.'
        });

    } catch (error) {
        console.error('[Cron A] Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
