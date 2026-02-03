import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

interface WaitlistEntry {
    email: string;
    timestamp: string;
    ip?: string;
}

// Email validation regex - keeping strict validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        // Validate email
        if (!email || typeof email !== 'string') {
            return NextResponse.json(
                { success: false, message: 'Email is required' },
                { status: 400 }
            );
        }

        const trimmedEmail = email.trim().toLowerCase();

        if (!EMAIL_REGEX.test(trimmedEmail)) {
            return NextResponse.json(
                { success: false, message: 'Invalid email format' },
                { status: 400 }
            );
        }

        try {
            const db = await getDatabase();
            const collection = db.collection('waitlist');

            // Check for duplicates
            const existingEntry = await collection.findOne({ email: trimmedEmail });

            if (existingEntry) {
                return NextResponse.json(
                    { success: false, message: 'Email already registered' },
                    { status: 409 }
                );
            }

            // Add new entry
            const newEntry: WaitlistEntry = {
                email: trimmedEmail,
                timestamp: new Date().toISOString(),
                ip: request.ip || request.headers.get('x-forwarded-for') || undefined,
            };

            await collection.insertOne(newEntry);

            // Get total count for display
            const count = await collection.countDocuments();

            return NextResponse.json(
                {
                    success: true,
                    message: 'Successfully joined the waitlist!',
                    count: count
                },
                { status: 201 }
            );
        } catch (dbError) {
            console.error('Database error:', dbError);
            return NextResponse.json(
                { success: false, message: 'Database connection failed. Please try again later.' },
                { status: 503 }
            );
        }
    } catch (error) {
        console.error('Waitlist API error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error. Please try again.' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const db = await getDatabase();
        const collection = db.collection('waitlist');
        const count = await collection.countDocuments();

        return NextResponse.json({
            success: true,
            count: count,
        });
    } catch (error) {
        console.error('Waitlist count error:', error);
        return NextResponse.json({
            success: true, // Fail gracefully for UI
            count: 0,
        });
    }
}
