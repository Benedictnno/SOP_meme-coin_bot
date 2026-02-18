// app/api/cron/route.ts
// Cron endpoint for scheduled scanning (triggered by Vercel Cron)

import { NextRequest, NextResponse } from 'next/server';
import { BotSettings } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/cron
 * Scheduled scanning endpoint - triggered by Vercel Cron
 * Requires CRON_SECRET for authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (authHeader !== expectedAuth) {
      console.error('Unauthorized cron request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Cron job triggered at', new Date().toISOString());

    // Load settings from environment variables
    const settings: BotSettings = {
      minLiquidity: Number(process.env.MIN_LIQUIDITY_USD) || 50000,
      maxTopHolderPercent: Number(process.env.MAX_TOP_HOLDER_PERCENT) || 10,
      minVolumeIncrease: Number(process.env.MIN_VOLUME_INCREASE_PERCENT) || 200,
      scanInterval: Number(process.env.SCAN_INTERVAL_SECONDS) || 300,
      enableTelegramAlerts: process.env.TELEGRAM_BOT_TOKEN ? true : false,
      telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
      telegramChatId: process.env.TELEGRAM_CHAT_ID,
      aiMode: 'balanced'
    };

    console.log('Cron settings:', {
      minLiquidity: settings.minLiquidity,
      maxTopHolder: settings.maxTopHolderPercent,
      minVolume: settings.minVolumeIncrease,
      telegramEnabled: settings.enableTelegramAlerts
    });

    // Trigger scan via internal API call
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const scanResponse = await fetch(`${appUrl}/api/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(settings)
    });

    if (!scanResponse.ok) {
      const error = await scanResponse.text();
      console.error('Scan failed:', error);
      throw new Error(`Scan failed: ${error}`);
    }

    const result = await scanResponse.json();

    console.log('Cron scan complete:', {
      scanned: result.scanned,
      valid: result.valid,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      scanned: result.scanned,
      valid: result.valid,
      message: `Scanned ${result.scanned} tokens, found ${result.valid} valid setups`
    });

  } catch (error) {
    console.error('Cron job error:', error);

    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron
 * Alternative endpoint for manual cron testing
 */
export async function POST(request: NextRequest) {
  // Same logic as GET, allows manual triggering
  return GET(request);
}