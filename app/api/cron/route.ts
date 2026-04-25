import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ 
    error: 'Deprecated', 
    message: 'This endpoint is retired. Please use /api/cron/discovery, /api/cron/validate, and /api/wallets/monitor directly.' 
  }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({ 
    error: 'Deprecated', 
    message: 'This endpoint is retired. Please use /api/cron/discovery, /api/cron/validate, and /api/wallets/monitor directly.' 
  }, { status: 410 });
}