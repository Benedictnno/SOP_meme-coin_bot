import { NextRequest, NextResponse } from 'next/server';
import { createEnhancedAlert } from '@/lib/validation-utils';
import { BotSettings } from '@/types';
import { getDatabase } from '@/lib/mongodb';
import { sendTelegramAlert } from '@/lib/telegram';

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json();

        if (!Array.isArray(payload)) {
            return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
        }

        console.log(`[Helius Webhook] Received ${payload.length} events`);

        const db = await getDatabase();
        const activeUsers = await db.collection('users').find({
            'settings.enableTelegramAlerts': true,
            telegramChatId: { $exists: true, $ne: '' }
        }).toArray();

        if (activeUsers.length === 0) {
            return NextResponse.json({ message: 'No active users to alert' });
        }

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
            const tokenData = {
                mint: tokenMint,
                symbol: event.symbol || 'UNK',
                name: event.name || 'Unknown Token',
                liquidity: event.liquidity || 0,
                volumeIncrease: 200,
                priceUSD: event.price || '0',
                marketCap: event.marketCap || 0,
                narrative: 'Real-time discovery via Helius Webhook'
            };

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
                console.log(`[Helius Webhook] Valid token found: ${tokenData.symbol} (${tokenMint})`);

                for (const user of activeUsers) {
                    const userSettings = user.settings || masterSettings;

                    // Filter based on user-specific score threshold
                    if (alert.compositeScore >= (userSettings.minCompositeScore || 0)) {
                        // Check if we sent this alert to this user recently
                        const lastSent = await db.collection('sent_alerts').findOne({
                            userId: user._id.toString(),
                            mint: tokenMint,
                            timestamp: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
                        });

                        if (!lastSent) {
                            await sendTelegramAlert(alert, user.telegramChatId);
                            await db.collection('sent_alerts').insertOne({
                                userId: user._id.toString(),
                                mint: tokenMint,
                                symbol: tokenData.symbol,
                                type: 'webhook_alert',
                                timestamp: new Date().toISOString()
                            });
                            console.log(`[Helius Webhook] Alert sent to ${user.email} for ${tokenData.symbol}`);
                        }
                    }
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Helius Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
