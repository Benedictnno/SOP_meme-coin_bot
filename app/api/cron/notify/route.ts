import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { sendTelegramAlert, sendTeaserAlert } from '@/lib/telegram';
import { getAllActiveUsers, hasActiveSubscription } from '@/lib/users';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/notify
 * Dedicated notifier — the ONLY place that calls getAllActiveUsers() and sends Telegram messages.
 * Reads from delivery_queue written by createEnhancedAlert and fans out to users.
 * Run every 1 minute via Vercel cron (see vercel.json).
 */
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user && (session.user as any).role === 'admin';
    const authHeader = request.headers.get('authorization');

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && !isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();

    // Fetch undelivered signals from the queue, best composite score first
    const pendingDeliveries = await db.collection('delivery_queue')
        .find({ delivered: false })
        .sort({ compositeScore: -1 })
        .limit(10)
        .toArray();

    if (pendingDeliveries.length === 0) {
        return NextResponse.json({ success: true, message: 'No pending deliveries' });
    }

    const users = await getAllActiveUsers();

    const recentAlerts = await db.collection('sent_alerts').find({
        timestamp: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }).toArray();
    const recentAlertsSet = new Set(recentAlerts.map(a => `${a.userId}-${a.mint}`));

    let totalSent = 0;
    const deliveredMints: string[] = [];

    for (const delivery of pendingDeliveries) {
        const alert = delivery.alert;
        let sentToAny = false;

        for (const user of users) {
            if (!user.telegramChatId) continue;

            const userSettings = user.settings;
            const alertKey = `${user._id?.toString()}-${delivery.mint}`;
            if (recentAlertsSet.has(alertKey)) continue;

            // Apply per-user filters
            const meetsLiquidity = alert.token.liquidity >= (userSettings?.minLiquidity ?? 50000);
            const meetsHolders   = (alert.token.topHolderPercent ?? 100) <= (userSettings?.maxTopHolderPercent ?? 10);
            const meetsScore     = alert.compositeScore >= (userSettings?.minCompositeScore ?? 30);
            const meetsWhale     = userSettings?.whaleOnly ? alert.whaleActivity.involved : true;

            if (!meetsLiquidity || !meetsHolders || !meetsScore || !meetsWhale) continue;

            const isActive = await hasActiveSubscription(user);

            if (isActive) {
                await sendTelegramAlert(alert, user.telegramChatId);
                await db.collection('sent_alerts').insertOne({
                    userId: user._id?.toString(),
                    mint: delivery.mint,
                    symbol: alert.token.symbol,
                    type: 'alert',
                    timestamp: new Date()
                });
                recentAlertsSet.add(alertKey);
                totalSent++;
                sentToAny = true;
            } else {
                // Send teaser to users whose trial/subscription has lapsed
                await sendTeaserAlert(alert, user.telegramChatId, user._id?.toString() ?? '');
            }
        }

        if (sentToAny) {
            deliveredMints.push(delivery.mint);
        }
    }

    // Mark delivered items so they won't be re-sent
    if (deliveredMints.length > 0) {
        await db.collection('delivery_queue').updateMany(
            { mint: { $in: deliveredMints } },
            { $set: { delivered: true, deliveredAt: new Date() } }
        );
    }

    return NextResponse.json({
        success: true,
        deliveries: pendingDeliveries.length,
        sent: totalSent
    });
}
