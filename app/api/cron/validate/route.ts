import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getDatabase } from '@/lib/mongodb';
import { createEnhancedAlert } from '@/lib/validation-utils';
import { sendTelegramAlert } from '@/lib/telegram';
import { getAllActiveUsers } from '@/lib/users';
import { BotSettings } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/validate
 * CRON B: Validates top pending tokens heavily.
 * Ensures Tier 3 AI and full checks pass without hitting API limits.
 * Triggered every 30 seconds.
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
        const recentAlertsColl = db.collection('sent_alerts');

        // Fetch top 5 pending tokens, ordered by highest volume increase
        const tokensToProcess = await pendingTokensColl.find({ processing: false })
            .sort({ volumeIncrease: -1 })
            .limit(5)
            .toArray();

        if (tokensToProcess.length === 0) {
            return NextResponse.json({ success: true, message: 'No pending tokens to validate.' });
        }

        // Mark as processing immediately to prevent parallel crons overlapping
        const tokenMints = tokensToProcess.map(t => t.mint);
        await pendingTokensColl.updateMany(
            { mint: { $in: tokenMints } },
            { $set: { processing: true } }
        );

        const usersToAlert = await getAllActiveUsers();
        const masterSettings: BotSettings = {
            minLiquidity: Number(process.env.MIN_LIQUIDITY_USD) || 50000,
            maxTopHolderPercent: Number(process.env.MAX_TOP_HOLDER_PERCENT) || 10,
            minVolumeIncrease: Number(process.env.MIN_VOLUME_INCREASE_PERCENT) || 200,
            scanInterval: Number(process.env.SCAN_INTERVAL_SECONDS) || 60,
            enableTelegramAlerts: true,
            aiMode: 'balanced'
        };

        const validatedMints: string[] = [];

        // Pre-fetch recent alerts to prevent massive connection pooling
        const recentAlerts = await recentAlertsColl.find({
            timestamp: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }).toArray();
        const recentAlertsSet = new Set(recentAlerts.map(a => `${a.userId}-${a.mint}`));

        let validCount = 0;
        const pendingInserts: any[] = [];

        // Execute serially (concurrency=1) to prevent RPC flooding.
        // We have decoupled from the 10-second limit since CRON tasks via 3rd party
        // generally run until Lambda timeout.
        for (const token of tokensToProcess as any[]) {
            const tokenData = { ...token };
            delete tokenData._id;
            delete tokenData.discoveredAt;
            delete tokenData.processing;
            
            try {
                // Pass skipBundleDetector = true because Cron Validation doesn't need 200 RPC checks per token
                const alert = await createEnhancedAlert(tokenData, masterSettings, true);
                let sentToAnyUser = false;

                for (const user of usersToAlert) {
                    const userSettings = user.settings || masterSettings;
                    const meetsLiquidity = tokenData.liquidity >= (userSettings.minLiquidity || 0);
                    const meetsHolders = (tokenData.topHolderPercent || 100) <= (userSettings.maxTopHolderPercent || 100);
                    const meetsScore = alert.compositeScore >= 30; // Temporarily lowered from (userSettings.minCompositeScore || 0)

                    if (meetsLiquidity && meetsHolders && meetsScore) {
                        const userIdStr = user._id?.toString() || 'unknown';
                        const alertKey = `${userIdStr}-${tokenData.mint}`;
                        const lastSent = recentAlertsSet.has(alertKey);

                        if (!lastSent && (userSettings.enableTelegramAlerts ?? true) && user.telegramChatId) {
                            await sendTelegramAlert(alert, user.telegramChatId);
                            
                            pendingInserts.push({
                                userId: userIdStr,
                                mint: tokenData.mint,
                                symbol: tokenData.symbol,
                                type: 'alert',
                                timestamp: new Date()
                            });
                            recentAlertsSet.add(alertKey);
                            sentToAnyUser = true;
                        }
                    }
                }
                
                if (sentToAnyUser) validCount++;
                validatedMints.push(token.mint);

            } catch (err) {
                console.error(`[Cron B] Error validating ${token.symbol}:`, err);
                validatedMints.push(token.mint); // Remove it on failure to unblock pipeline
            }
        }

        if (pendingInserts.length > 0) {
            await recentAlertsColl.insertMany(pendingInserts);
        }

        // Cleanup processed
        await pendingTokensColl.deleteMany({ mint: { $in: validatedMints } });

        // Update total scanned tokens stat
        if (validatedMints.length > 0) {
            const statsColl = db.collection('system_stats');
            await statsColl.updateOne(
                { _id: 'global_stats' },
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
