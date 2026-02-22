import { NextRequest, NextResponse } from 'next/server';
import { createEnhancedAlert } from '@/lib/validation-utils';
import { BotSettings } from '@/types';
import { getDatabase } from '@/lib/mongodb';
import { sendTelegramAlert } from '@/lib/telegram';

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json();

        // Helius sends an array of transactions/events
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

        // Process each event (looking for pool creation or significant liquidity moves)
        for (const event of payload) {
            // Simplified logic for brainstorming: 
            // In a real Helius webhook, you'd check event.type === 'SWAP' or specific program IDs
            // For now, let's assume the payload contains token metadata we can validate

            const tokenMint = event.tokenMint || event.mint;
            if (!tokenMint) continue;

            const tokenData = {
                mint: tokenMint,
                symbol: event.symbol || 'UNK',
                name: event.name || 'Unknown Token',
                liquidity: event.liquidity || 0,
                volumeIncrease: 200, // Trigger validation
                priceUSD: event.price || '0',
                marketCap: event.marketCap || 0,
                narrative: 'Real-time discovery via Helius Webhook'
            };

            // Fast validation using our new tiered system
            // We use default master settings for the initial webhook filter
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
                console.log(`[Sniper Alpha] Real-time alert for ${tokenData.symbol}! Tier reached: ${alert.tierReached}`);

                // Alert all matching users
                for (const user of activeUsers) {
                    const userSettings = user.settings || masterSettings;
                    if (alert.compositeScore >= (userSettings.minCompositeScore || 0)) {
                        await sendTelegramAlert(alert, user.telegramChatId);
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
