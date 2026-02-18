import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { TrackedWallet, BotSettings } from '@/types';
import { getWalletActivity } from '@/lib/validators/helius';
import { createEnhancedAlert } from '@/lib/validation-utils';
import { sendWalletActivityAlert } from '@/lib/telegram';
import { getUserById } from '@/lib/users';
import { getTokenDetails } from '@/lib/validators/dexscreener';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/wallets/monitor
 * Background task to scan ALL tracked wallets for new activity.
 * Triggered by cron.
 */
export async function GET(request: NextRequest) {
    try {
        // 1. Get all tracked wallets
        const db = await getDatabase();
        const allTracked = await db.collection<TrackedWallet>('tracked_wallets').find({}).toArray();

        console.log(`Monitoring ${allTracked.length} wallets for activity...`);

        let totalNewAlerts = 0;

        // 2. Process in batches to avoid rate limits
        for (const wallet of allTracked) {
            try {
                const activity = await getWalletActivity(wallet.address);
                if (activity.length === 0) continue;

                const latestTx = activity[0].signature;
                if (latestTx === wallet.lastNotifiedTx) continue;

                // Find which transactions are new since last check
                const newSwaps = [];
                for (const swap of activity) {
                    if (swap.signature === wallet.lastNotifiedTx) break;
                    newSwaps.push(swap);
                }

                if (newSwaps.length === 0) continue;

                // Get user settings for validation
                const user = await getUserById(wallet.userId);
                if (!user || !user.telegramChatId) continue;

                const settings: BotSettings = user.settings || {
                    minLiquidity: 20000,
                    maxTopHolderPercent: 10,
                    minVolumeIncrease: 100,
                    scanInterval: 300,
                    enableTelegramAlerts: true,
                    aiMode: 'balanced'
                };

                // 3. Process new swaps
                for (const swap of newSwaps.reverse()) { // Process oldest first
                    let validation = null;
                    let enrichedSwap = { ...swap };

                    try {
                        const token = await getTokenDetails(swap.tokenMint);
                        if (token) {
                            validation = await createEnhancedAlert(token, settings);
                            if (enrichedSwap.tokenSymbol === 'UNKNOWN') {
                                enrichedSwap.tokenSymbol = token.symbol;
                            }
                        }
                    } catch (err) {
                        console.error(`Validation failed for wallet activity token ${swap.tokenMint}:`, err);
                    }

                    // 4. Send Telegram Alert
                    await sendWalletActivityAlert(
                        enrichedSwap,
                        wallet.label || 'Unnamed Wallet',
                        wallet.address,
                        validation,
                        user.telegramChatId
                    );

                    totalNewAlerts++;
                }

                // 5. Update last notified TX
                await db.collection('tracked_wallets').updateOne(
                    { _id: wallet._id },
                    { $set: { lastNotifiedTx: latestTx } }
                );

            } catch (err) {
                console.error(`Error monitoring wallet ${wallet.address}:`, err);
            }
        }

        return NextResponse.json({
            success: true,
            monitored: allTracked.length,
            alertsSent: totalNewAlerts
        });

    } catch (error) {
        console.error('Wallet monitor error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
