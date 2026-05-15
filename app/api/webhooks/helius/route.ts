import { NextRequest, NextResponse } from 'next/server';
import { createEnhancedAlert } from '@/lib/validation-utils';
import { BotSettings } from '@/types';
import { getDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const expectedSecret = process.env.HELIUS_WEBHOOK_SECRET;

        if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
            console.error('Unauthorized Helius webhook request');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await request.json();

        if (!Array.isArray(payload)) {
            return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
        }

        console.log(`[Helius Webhook] Received ${payload.length} events`);

        const db = await getDatabase();
        
        // 1. Write heartbeat for health monitoring
        await db.collection('app_state').updateOne(
            { key: 'helius_webhook_last_seen' },
            { $set: { timestamp: new Date(), count: payload.length } },
            { upsert: true }
        );

        for (const event of payload) {
            // Robustly identify the target token mint
            let tokenMint = event.tokenMint || event.mint;

            // If it's a swap, look in tokenInputs/Outputs
            if (!tokenMint && event.type === 'SWAP' && event.events?.swap) {
                const swap = event.events.swap;
                const allTokens = [...(swap.tokenInputs || []), ...(swap.tokenOutputs || [])];
                const targetToken = allTokens.find((t: any) =>
                    t.mint !== 'So11111111111111111111111111111111111111112' &&
                    t.mint !== 'So11111111111111111111111111111111111111111'
                );
                tokenMint = targetToken?.mint;
            }

            if (!tokenMint) continue;

            // Basic token data for validation
            let tokenData: any = {
                mint: tokenMint,
                symbol: event.symbol || 'UNK',
                name: event.name || 'Unknown Token',
                liquidity: event.liquidity || 0,
                volumeIncrease: 200,
                priceUSD: event.price || '0',
                marketCap: event.marketCap || 0,
                narrative: 'Real-time discovery via Helius Webhook'
            };

            try {
                const { getTokenDetails } = await import('@/lib/validators/dexscreener');
                const dexToken = await getTokenDetails(tokenMint);
                if (dexToken) {
                    tokenData = {
                        ...tokenData,
                        symbol: dexToken.symbol || tokenData.symbol,
                        name: dexToken.name || tokenData.name,
                        liquidity: dexToken.liquidity, // Real liquidity from DexScreener
                        priceUSD: dexToken.priceUSD || tokenData.priceUSD,
                        marketCap: dexToken.marketCap || tokenData.marketCap
                    };
                }
            } catch (err) {
                console.error(`Failed to fetch DexScreener data for ${tokenMint}`, err);
            }

            const masterSettings: BotSettings = {
                minLiquidity: Number(process.env.MIN_LIQUIDITY_USD) || 20000,
                maxTopHolderPercent: Number(process.env.MAX_TOP_HOLDER_PERCENT) || 10,
                minVolumeIncrease: Number(process.env.MIN_VOLUME_INCREASE_PERCENT) || 100,
                scanInterval: 300,
                enableTelegramAlerts: true,
                aiMode: 'balanced'
            };

            const alert = await createEnhancedAlert(tokenData as any, masterSettings);

            if (alert.isValid) {
                console.log(`[Helius Webhook] Valid token processed and queued for delivery: ${tokenData.symbol} (${tokenMint})`);
                // Delivery is handled by /api/cron/notify
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Helius Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
