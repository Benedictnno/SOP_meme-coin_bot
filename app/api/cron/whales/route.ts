import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getKnownWhales, calculatePnL, updateWhaleScore } from '@/lib/optimizations/whale-tracker';
import { getWalletActivity } from '@/lib/validators/helius';
import { getAllActiveUsers } from '@/lib/users';
import { BotSettings } from '@/types';
import { sendTelegramAlert } from '@/lib/telegram'; // Requires an updated convergence capability

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/whales
 * CRON C: Whale Tracker Background Sync Engine
 * Fetches recent swap activities, crunches PnL values, and triggers convergence alerts if >3 whales enter same Token.
 * Run every 5 minutes.
 */
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

        if (authHeader !== expectedAuth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = await getDatabase();
        const activeWhales = await getKnownWhales();
        
        let processedSwaps = 0;
        let activeTokens = new Map<string, Set<string>>(); // tokenMint -> set of walletAddresses

        const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

        for (const whale of activeWhales) {
            try {
                // Fetch swaps (bounded loosely to recent by Helius if not paginating)
                const swaps = await getWalletActivity(whale.address);
                if (swaps.length > 0) {
                    await calculatePnL(whale.address, swaps);
                    await updateWhaleScore(whale.address);
                    processedSwaps += swaps.length;

                   // Aggregate convergence: who bought what recently
                   const thirtyMinsAgo = Date.now() - (30 * 60 * 1000);
                   const recentBuys = swaps.filter(s => s.type === 'buy' && new Date(s.timestamp).getTime() > thirtyMinsAgo);
                   
                   for (const buy of recentBuys) {
                       if (!activeTokens.has(buy.tokenMint)) activeTokens.set(buy.tokenMint, new Set());
                       activeTokens.get(buy.tokenMint)?.add(whale.address);
                   }
                }
                await delay(150); // Respect Helius 15 RPS limit
            } catch (err) {
                 console.error(`[Cron C] Error processing whale ${whale.address}:`, err);
            }
        }

        // Convergence Check: Did 3+ whales buy the exact same token in the last 30 minutes?
        for (const [mint, walletSet] of activeTokens.entries()) {
            if (walletSet.size >= 3) {
                const recentAlertsColl = db.collection('sent_alerts');
                const adminAlertKey = `convergence-${mint}`;
                
                // Have we already fired a convergence alert for this token recently?
                const alreadySent = await recentAlertsColl.findOne({
                     type: 'convergence',
                     mint,
                     timestamp: { $gt: new Date(Date.now() - 4 * 60 * 60 * 1000) } // don't repeat within 4 hrs
                });

                if (!alreadySent) {
                    console.log(`[Cron C] MULTI-WALLET CONVERGENCE DETECTED on ${mint} by ${walletSet.size} whales!`);
                    
                    const usersToAlert = await getAllActiveUsers();
                    const botToken = process.env.TELEGRAM_BOT_TOKEN;

                    for (const user of usersToAlert) {
                        if (user.settings?.enableTelegramAlerts && user.telegramChatId && botToken) {
                            const message = `
🚨 <b>URGENT: MULTI-WALLET CONVERGENCE</b> 🚨

<b>Token:</b> <code>${mint}</code>
<b>Signal:</b> 🐋 ${walletSet.size} Tracked Whales just bought in the last 30 minutes!
<b>Conviction Strength: 🟢 MAXIMUM</b>

This usually represents an insider or high-conviction group move.

<b>🔗 Trade:</b>
<a href="https://jup.ag/swap/SOL-${mint}">Buy on Jupiter</a>
                            `.trim();

                            fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    chat_id: user.telegramChatId,
                                    text: message,
                                    parse_mode: 'HTML',
                                    disable_web_page_preview: true
                                })
                            }).catch(e => console.error("Convergence TG send error", e));
                        }
                    }

                    await recentAlertsColl.insertOne({
                        type: 'convergence',
                        mint,
                        timestamp: new Date()
                    });
                }
            }
        }

        return NextResponse.json({
            success: true,
            walletsTracked: activeWhales.length,
            processedSwaps,
            message: 'Whale Sync Complete'
        });

    } catch (error) {
        console.error('[Cron C] Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
