import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

/**
 * POST /api/admin/setup
 * Securely promote a user to admin using the CRON_SECRET.
 * Body: { "email": "user@example.com" }
 * Header: Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const expectedSecret = process.env.CRON_SECRET;

        if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
        }

        const db = await getDatabase();

        // Find user by email
        const user = await db.collection('users').findOne({ email });

        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found. Please register first.' }, { status: 404 });
        }

        // Promote to admin
        const result = await db.collection('users').updateOne(
            { email },
            { $set: { role: 'admin' } }
        );

        if (result.modifiedCount === 0 && user.role === 'admin') {
            return NextResponse.json({ success: true, message: 'User is already an admin.' });
        }

        console.log(`User ${email} promoted to admin via setup API.`);

        return NextResponse.json({
            success: true,
            message: `Successfully promoted ${email} to admin.`
        });

    } catch (error) {
        console.error('Admin setup error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
