import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface WaitlistEntry {
    email: string;
    timestamp: string;
    ip?: string;
}

const WAITLIST_FILE = path.join(process.cwd(), 'waitlist.json');

// Email validation regex
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

        // Read existing waitlist
        let waitlist: WaitlistEntry[] = [];
        try {
            const fileContent = await fs.readFile(WAITLIST_FILE, 'utf-8');
            waitlist = JSON.parse(fileContent);
        } catch (error) {
            // File doesn't exist yet, will create it
            waitlist = [];
        }

        // Check for duplicates
        const exists = waitlist.some((entry) => entry.email === trimmedEmail);
        if (exists) {
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

        waitlist.push(newEntry);

        // Save to file
        await fs.writeFile(WAITLIST_FILE, JSON.stringify(waitlist, null, 2), 'utf-8');

        return NextResponse.json(
            {
                success: true,
                message: 'Successfully joined the waitlist!',
                count: waitlist.length
            },
            { status: 201 }
        );
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
        const fileContent = await fs.readFile(WAITLIST_FILE, 'utf-8');
        const waitlist: WaitlistEntry[] = JSON.parse(fileContent);

        return NextResponse.json({
            success: true,
            count: waitlist.length,
        });
    } catch (error) {
        return NextResponse.json({
            success: true,
            count: 0,
        });
    }
}
