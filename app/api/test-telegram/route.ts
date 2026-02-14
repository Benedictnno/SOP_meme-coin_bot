import { NextResponse } from 'next/server';
import { sendTestMessage } from '@/lib/telegram';

export async function POST() {
    try {
        const success = await sendTestMessage();
        if (success) {
            return NextResponse.json({ success: true, message: 'Test alert sent successfully!' });
        } else {
            return NextResponse.json({ success: false, message: 'Failed to send test alert. Check your logs and credentials.' }, { status: 500 });
        }
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
    }
}
