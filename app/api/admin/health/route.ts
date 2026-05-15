import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/health
 * Returns real-time pipeline health metrics for the admin dashboard.
 * Checks webhook activity, pending queues, and delivery throughput.
 */
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    const now         = new Date();
    const oneHourAgo  = new Date(now.getTime() - 60 * 60 * 1000);
    const fiveMinAgo  = new Date(now.getTime() - 5 * 60 * 1000);

    const [
        pendingCount,
        deliveryQueueCount,
        recentDiscoveries,
        globalStats,
        recentDeliveries,
        webhookEvents
    ] = await Promise.all([
        db.collection('pending_tokens').countDocuments(),
        db.collection('delivery_queue').countDocuments({ delivered: false }),
        db.collection('pending_tokens').countDocuments({
            discoveredAt: { $gt: oneHourAgo }
        }),
        db.collection('system_stats').findOne({ _id: 'global_stats' as any }),
        db.collection('sent_alerts').countDocuments({
            timestamp: { $gt: oneHourAgo }
        }),
        db.collection('app_state').findOne({ key: 'helius_webhook_last_seen' })
    ]);

    const webhookHealthy = webhookEvents && (now.getTime() - new Date(webhookEvents.timestamp).getTime()) < 5 * 60 * 1000;

    return NextResponse.json({
        timestamp: now.toISOString(),
        pipeline: {
            webhookActive:      webhookHealthy,
            pendingValidation:  pendingCount,
            pendingDelivery:    deliveryQueueCount,
            discoveriesLastHour: recentDiscoveries,
            deliveriesLastHour:  recentDeliveries,
            totalTokensScanned:  globalStats?.totalTokensScanned ?? 0
        },
        status: webhookHealthy ? 'healthy' : 'degraded — webhook may be down'
    });
}
