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

    // Check Subscription / Free Trial
    const isSubscribed = await hasActiveSubscription(user);

    // --- Behavioral Decay: expired users get a teaser scan, not a hard block ---
    const isExpired = !isSubscribed;
    const hasTelegram = !!(user.telegramChatId);

    // Use user-specific settings if available
    const bodySettings = await request.json().catch(() => ({}));
    const settings: BotSettings = user.settings ? {
      ...user.settings,
      ...bodySettings
    } : {
      minLiquidity: 50000,
      maxTopHolderPercent: 10,
      minVolumeIncrease: 200,
      scanInterval: 60,
      enableTelegramAlerts: false,
      minCompositeScore: 50,
      minSocialScore: 30,
      whaleOnly: false,
      aiMode: 'balanced',
      ...bodySettings
    };

    // 1. Discover Tokens via DEX Screener
    console.log(`Starting scan for ${user.email} (expired=${isExpired})`);
    const discoveredTokens = await scanDEXScreener(settings.minVolumeIncrease);
    console.log(`Discovered ${discoveredTokens.length} potential tokens`);

    const alerts: EnhancedAlert[] = [];
    let scannedCount = 0;
    let validCount = 0;

    // 2. Validate each token
    for (const token of discoveredTokens) {
      scannedCount++;

      try {
        const alert = await createEnhancedAlert(token, settings);
        const { isValid, compositeScore } = alert;
        const validationResult = { checks: alert.checks, enhancements: { whaleActivity: alert.whaleActivity, txPatterns: { suspiciousPatterns: alert.risks.filter(r => r.includes('Pattern')) }, bundleAnalysis: alert.bundleAnalysis, devScore: alert.devScore } };

        if (alert.aiAnalysis) {
          console.log(`[AI Analysis Generated] for ${token.symbol}: ${alert.aiAnalysis.summary.substring(0, 50)}...`);
        } else {
          console.log(`[AI Analysis Missing] for ${token.symbol}`);
        }

        const passesWhaleFilter = !settings.whaleOnly || validationResult.enhancements.whaleActivity.involved;

        if (compositeScore >= (settings.minCompositeScore || 0) && passesWhaleFilter) {
          const { getDatabase } = await import('@/lib/mongodb');
          const db = await getDatabase();
          const lastSent = await db.collection('sent_alerts').findOne({
            userId: userId,
            mint: token.mint,
            type: { $ne: 'teaser' },
            timestamp: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
          });

          if (!lastSent) {
            // For expired users: send teaser Telegram then stop — don't add to alerts array
            if (isExpired) {
              if (hasTelegram && compositeScore >= 70) {
                const { sendTeaserAlert } = await import('@/lib/telegram');
                await sendTeaserAlert(alert, user.telegramChatId!, userId);
              }
              // Don't push to alerts for expired users — dashboard response is 403 below
              continue;
            }

            alerts.push(alert);
            if (isValid) validCount++;

            // Send Telegram if enabled FOR THIS USER
            if (settings.enableTelegramAlerts && user.telegramChatId) {
              const { sendTelegramAlert } = await import('@/lib/telegram');
              await sendTelegramAlert(alert, user.telegramChatId);

              await db.collection('sent_alerts').insertOne({
                userId: userId,
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

    // Return 403 for expired users after running the teaser scan
    if (isExpired) {
      return NextResponse.json(
        {
          success: false,
          error: 'subscription_required',
          message: 'Your 21-day free trial has ended. Subscribe to continue receiving alerts.',
          scanned: scannedCount,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      scanned: scannedCount,
      valid: validCount,
      alerts
    });

  } catch (error) {
    console.error('Scan API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}