import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { scanDEXScreener } from '@/lib/validators/dexscreener';
import { validateTokenEnhanced } from '@/lib/sop-validator';
import { createEnhancedAlert } from '@/lib/validation-utils';
import { BotSettings, EnhancedAlert } from '@/types';
import { getUserById, hasActiveSubscription } from '@/lib/users';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const isMasterScan = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    let usersToAlert: any[] = [];
    let masterSettings: BotSettings;

    if (isMasterScan) {
      // MASTER SCAN MODE: Single discovery, multi-user alerting
      console.log('Master Scan triggered via Cron Secret');
      const { getAllActiveUsers } = await import('@/lib/users');
      usersToAlert = await getAllActiveUsers();
      console.log(`Master Scan: Identified ${usersToAlert.length} active users to alert`);

      const bodySettings = await request.json().catch(() => ({}));
      masterSettings = {
        minLiquidity: Number(process.env.MIN_LIQUIDITY_USD) || 50000,
        maxTopHolderPercent: Number(process.env.MAX_TOP_HOLDER_PERCENT) || 10,
        minVolumeIncrease: Number(process.env.MIN_VOLUME_INCREASE_PERCENT) || 200,
        ...bodySettings
      };
    } else {
      // SINGLE USER MODE: Standard dashboard trigger
      const session = await getServerSession(authOptions);
      if (!session || !session.user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized. Please sign in.' },
          { status: 401 }
        );
      }

      const userId = (session.user as any).id;
      const user = await getUserById(userId);
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found.' },
          { status: 404 }
        );
      }

      const isSubscribed = await hasActiveSubscription(user);
      if (!isSubscribed) {
        return NextResponse.json(
          { success: false, error: 'subscription_required', message: 'Your free trial has ended.' },
          { status: 403 }
        );
      }

      usersToAlert = [user];
      const bodySettings = await request.json().catch(() => ({}));
      masterSettings = {
        minLiquidity: user.settings?.minLiquidity || 50000,
        maxTopHolderPercent: user.settings?.maxTopHolderPercent || 10,
        minVolumeIncrease: user.settings?.minVolumeIncrease || 200,
        ...bodySettings
      };
    }

    // 1. Discover Tokens using Master Settings
    console.log(`Starting discovery scan with minVolume: ${masterSettings.minVolumeIncrease}%`);
    const discoveredTokens = await scanDEXScreener(masterSettings.minVolumeIncrease);
    console.log(`Discovered ${discoveredTokens.length} potential tokens`);

    const alerts: EnhancedAlert[] = [];
    let scannedCount = 0;
    let validCount = 0;

    // 2. Validate each token
    for (const token of discoveredTokens) {
      scannedCount++;
      try {
        // Validate token ONCE with master settings for initial check
        const alert = await createEnhancedAlert(token, masterSettings);

        // Record if it fits ANY user criteria
        let sentAny = false;

        for (const user of usersToAlert) {
          const userSettings = user.settings || masterSettings;

          // Per-user filtering
          const meetsLiquidity = token.liquidity >= (userSettings.minLiquidity || 0);
          const meetsHolders = (token.topHolderPercent || 100) <= (userSettings.maxTopHolderPercent || 100);
          const meetsScore = alert.compositeScore >= (userSettings.minCompositeScore || 0);

          if (meetsLiquidity && meetsHolders && meetsScore) {
            // Check if already sent to this specific user
            const { getDatabase } = await import('@/lib/mongodb');
            const db = await getDatabase();
            const lastSent = await db.collection('sent_alerts').findOne({
              userId: user._id.toString(),
              mint: token.mint,
              timestamp: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
            });

            if (!lastSent) {
              // Send Telegram if user has it enabled
              if (userSettings.enableTelegramAlerts && user.telegramChatId) {
                const { sendTelegramAlert } = await import('@/lib/telegram');
                await sendTelegramAlert(alert, user.telegramChatId);

                await db.collection('sent_alerts').insertOne({
                  userId: user._id.toString(),
                  mint: token.mint,
                  symbol: token.symbol,
                  type: 'alert',
                  timestamp: new Date().toISOString()
                });
                sentAny = true;
              }
            }

            // For single-user dashboard mode, add to display array
            if (!isMasterScan) {
              alerts.push(alert);
            }
          }
        }

        if (sentAny) validCount++;
      } catch (tokenError) {
        console.error(`Error validating token ${token.symbol}:`, tokenError);
      }
    }

    return NextResponse.json({
      success: true,
      scanned: scannedCount,
      valid: validCount,
      alerts: isMasterScan ? [] : alerts,
      isMasterScan
    });

  } catch (error) {
    console.error('Scan API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}