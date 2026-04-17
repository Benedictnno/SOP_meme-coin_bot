import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

/**
 * POST /api/admin/migrate-dates
 * One-off migration script to convert string-based dates to native MongoDB Date objects.
 * Secured by ADMIN_PROMOTION_SECRET.
 */
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const expectedSecret = process.env.ADMIN_PROMOTION_SECRET;

        if (!expectedSecret) {
            return NextResponse.json({ success: false, error: 'Setup disabled. Missing admin secret.' }, { status: 403 });
        }

        if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const db = await getDatabase();
        let migratedCount = 0;

        // Fetch all users
        const users = await db.collection('users').find({}).toArray();

        for (const user of users) {
            const updates: any = {};

            if (user.createdAt && typeof user.createdAt === 'string') {
                updates.createdAt = new Date(user.createdAt);
            }

            if (user.freeTrialStartedAt && typeof user.freeTrialStartedAt === 'string') {
                updates.freeTrialStartedAt = new Date(user.freeTrialStartedAt);
            }

            if (user.subscriptionExpiresAt && typeof user.subscriptionExpiresAt === 'string') {
                updates.subscriptionExpiresAt = new Date(user.subscriptionExpiresAt);
            }

            if (Object.keys(updates).length > 0) {
                await db.collection('users').updateOne(
                    { _id: user._id },
                    { $set: updates }
                );
                migratedCount++;
            }
        }

        // We can also initialize indexes here for convenience
        const { ensureIndexes } = await import('@/lib/mongodb');
        await ensureIndexes();

        return NextResponse.json({
            success: true,
            message: `Successfully migrated dates for ${migratedCount} users and initialized indexes.`,
            migratedCount
        });

    } catch (error) {
        console.error('Migration error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
