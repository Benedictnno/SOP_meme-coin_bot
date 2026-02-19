import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { scanDEXScreener } from '@/lib/validators/dexscreener';
import { validateTokenEnhanced } from '@/lib/sop-validator';
import { createEnhancedAlert } from '@/lib/validation-utils';
import { BotSettings, EnhancedAlert } from '@/types';
import { getUserById, hasActiveSubscription } from '@/lib/users';

export async function POST(request: Request) {
  const startTime = Date.now();
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
        aiMode: 'balanced',
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
        aiMode: user.settings?.aiMode || 'balanced',
        ...bodySettings
      };
    }

    // 1. Discover Tokens using Master Settings
    console.log(`Starting discovery scan with minVolume: ${masterSettings.minVolumeIncrease}%`);
    let discoveredTokens = await scanDEXScreener(masterSettings.minVolumeIncrease);

    // OPTIMIZATION: Limit discovery for Cron to ensure 10s completion
    if (isMasterScan) {
      discoveredTokens = discoveredTokens.slice(0, 5);
      console.log(`Master Scan: Limited discovery to top ${discoveredTokens.length} tokens for performance`);
    }

    console.log(`Discovered ${discoveredTokens.length} potential tokens`);

    const alerts: EnhancedAlert[] = [];
    let scannedCount = 0;
    let validCount = 0;

    // 2. Validate each token
    // OPTIMIZATION: Use parallel processing for Cron, sequential for User (to preserve UI logs)
    if (isMasterScan) {
      const { getDatabase } = await import('@/lib/mongodb');
      const db = await getDatabase();

      const validationPromises = discoveredTokens.map(async (token) => {
        // Time guard: Don't start new validation if we're past 8.5 seconds
        if (Date.now() - startTime > 8500) {
          console.log('Master Scan: 8.5s threshold reached, skipping remaining tokens');
          return null;
        }

        try {
          scannedCount++;
          // Skip AI analysis for Cron if we're running out of time (7s+)
          const skipAI = (Date.now() - startTime > 7000);
          const alert = await createEnhancedAlert(token, {
            ...masterSettings,
            aiMode: skipAI ? undefined : masterSettings.aiMode
          });

          let sentToAnyUser = false;
          for (const user of usersToAlert) {
            const userSettings = user.settings || masterSettings;
            if (token.liquidity >= (userSettings.minLiquidity || 0) &&
              (token.topHolderPercent || 100) <= (userSettings.maxTopHolderPercent || 100) &&
              alert.compositeScore >= (userSettings.minCompositeScore || 0)) {

              const lastSent = await db.collection('sent_alerts').findOne({
                userId: user._id.toString(),
                mint: token.mint,
                timestamp: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
              });

              if (!lastSent && userSettings.enableTelegramAlerts && user.telegramChatId) {
                const { sendTelegramAlert } = await import('@/lib/telegram');
                await sendTelegramAlert(alert, user.telegramChatId);
                await db.collection('sent_alerts').insertOne({
                  userId: user._id.toString(),
                  mint: token.mint,
                  symbol: token.symbol,
                  type: 'alert',
                  timestamp: new Date().toISOString()
                });
                sentToAnyUser = true;
              }
            }
          }
          if (sentToAnyUser) validCount++;
          return true;
        } catch (e) {
          console.error(`Validation failed for ${token.symbol}:`, e);
          return null;
        }
      });

      await Promise.all(validationPromises);
    } else {
      // SEQUENTIAL MODE FOR USER (Dashboard UI visibility)
      for (const token of discoveredTokens) {
        scannedCount++;
        try {
          const alert = await createEnhancedAlert(token, masterSettings);
          const user = usersToAlert[0];
          const userSettings = user.settings || masterSettings;

          if (token.liquidity >= (userSettings.minLiquidity || 0) &&
            (token.topHolderPercent || 100) <= (userSettings.maxTopHolderPercent || 100) &&
            alert.compositeScore >= (userSettings.minCompositeScore || 0)) {

            alerts.push(alert);
            validCount++;

            // Optional: User-triggered scans also send Telegram if enabled
            if (userSettings.enableTelegramAlerts && user.telegramChatId) {
              const { getDatabase } = await import('@/lib/mongodb');
              const db = await getDatabase();
              const lastSent = await db.collection('sent_alerts').findOne({
                userId: user._id.toString(),
                mint: token.mint,
                timestamp: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
              });

              if (!lastSent) {
                const { sendTelegramAlert } = await import('@/lib/telegram');
                await sendTelegramAlert(alert, user.telegramChatId);
                await db.collection('sent_alerts').insertOne({
                  userId: user._id.toString(),
                  mint: token.mint,
                  symbol: token.symbol,
                  type: 'alert',
                  timestamp: new Date().toISOString()
                });
              }
            }
          }
        } catch (tokenError) {
          console.error(`Error validating token ${token.symbol}:`, tokenError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      scanned: scannedCount,
      valid: validCount,
      alerts: isMasterScan ? [] : alerts,
      isMasterScan,
      executionTime: `${Date.now() - startTime}ms`
    });

  } catch (error) {
    console.error('Scan API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}