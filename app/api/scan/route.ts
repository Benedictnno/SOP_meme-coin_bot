import { NextResponse } from 'next/server';
import { scanDEXScreener } from '@/lib/validators/dexscreener';
import { validateTokenEnhanced } from '@/lib/sop-validator';
import { BotSettings, EnhancedAlert } from '@/types';

export async function POST(request: Request) {
  try {
    const settings: BotSettings = await request.json();

    // 1. Discover Tokens via DEX Screener
    console.log(`Starting scan with Volume Spike Target: ${settings.minVolumeIncrease}%`);
    const discoveredTokens = await scanDEXScreener(settings.minVolumeIncrease);
    console.log(`Discovered ${discoveredTokens.length} potential tokens from DEX Screener`);

    if (discoveredTokens.length === 0) {
      console.warn('SCAN FAILED: Discovery returned zero tokens. Check DEX Screener filters or volume spike setting.');
    }

    const alerts: EnhancedAlert[] = [];
    let scannedCount = 0;
    let validCount = 0;

    // 2. Validate each token
    for (const token of discoveredTokens) {
      scannedCount++;

      try {
        console.log(`Validating token [${scannedCount}/${discoveredTokens.length}]: ${token.symbol}`);

        // Run the enhanced SOP validation
        const validationResult = await validateTokenEnhanced(token, settings);

        // Calculate composite score based on validation results
        const baseScore = validationResult.rugCheckScore * 0.4;
        const narrativeScore = validationResult.enhancements.narrativeQuality.score * 0.2;
        const socialScore = validationResult.enhancements.socialSignals.overallScore;
        const whaleScore = validationResult.enhancements.whaleActivity.score;
        const liquidityScore = validationResult.enhancements.liquidityStability.isStable ? 100 : 0;

        // Weights
        let compositeScore = baseScore +
          narrativeScore +
          (socialScore * 0.15) +
          (whaleScore * 0.05) +
          (liquidityScore * 0.2);

        // Penalties
        if (!validationResult.enhancements.freshness.isFresh) compositeScore -= 10;
        if (!validationResult.enhancements.txPatterns.isOrganic) compositeScore -= 20;
        if (!validationResult.enhancements.marketContext.isRiskOn) compositeScore -= 10;

        // Deep Security Penalties
        if (validationResult.enhancements.bundleAnalysis.isBundled) compositeScore -= 30;
        if (validationResult.enhancements.devScore && validationResult.enhancements.devScore.score < 20) compositeScore -= 20;

        compositeScore = Math.max(0, Math.min(100, Math.round(compositeScore)));

        const isValid = validationResult.checks.narrative &&
          validationResult.checks.liquidity &&
          validationResult.checks.contract &&
          validationResult.checks.sellTest;



        // Create the alert object
        const recommendations = [];
        if (compositeScore >= 80) recommendations.push('🟢 STRONG BUY - All signals aligned');
        else if (compositeScore >= 70) recommendations.push('🟢 BUY - High confidence setup');
        else if (compositeScore >= 60) recommendations.push('🟡 MODERATE - Exercise caution');
        else recommendations.push('🔴 AVOID - High risk');

        if (validationResult.enhancements.txPatterns.suspiciousPatterns.length > 0) {
          recommendations.push('⚠️ Suspicious Patterns Detected');
        }

        if (validationResult.enhancements.whaleActivity.involved) {
          recommendations.push('🐋 Whale Wallets Involved');
        }

        if (validationResult.enhancements.bundleAnalysis.isBundled) {
          recommendations.push('⛔ BUNDLED LAUNCH - Avoid');
        }

        if (validationResult.enhancements.devScore && validationResult.enhancements.devScore.reputation === 'High') {
          recommendations.push('⭐ Trusted Developer History');
        }

        const alert: EnhancedAlert = {
          id: `alert-${token.mint}-${Date.now()}`,
          timestamp: new Date().toISOString(),
          token,
          checks: validationResult.checks,
          isValid,
          passedChecks: Object.values(validationResult.checks).filter(Boolean).length,
          totalChecks: Object.keys(validationResult.checks).length,
          setupType: token.volumeIncrease > 500 ? 'Base Break' : 'Pullback Entry',
          rugCheckScore: validationResult.rugCheckScore,
          compositeScore,
          socialSignals: validationResult.enhancements.socialSignals,
          whaleActivity: validationResult.enhancements.whaleActivity,
          timeMultiplier: 1.0,
          recommendations,
          risks: validationResult.risks,
          devScore: validationResult.enhancements.devScore || undefined,
          bundleAnalysis: validationResult.enhancements.bundleAnalysis
        };

        // 3. Filter based on Settings
        const minScore = settings.minCompositeScore ?? 0;
        const minSocial = settings.minSocialScore ?? 0;
        const whaleRequired = settings.whaleOnly ?? false;

        const passesScore = compositeScore >= minScore;
        const passesSocial = alert.socialSignals.overallScore >= minSocial;
        const passesWhale = !whaleRequired || alert.whaleActivity.involved;

        if (passesScore && passesSocial && passesWhale) {
          alerts.push(alert);
          if (isValid) validCount++;
        } else {
          console.log(`Token ${token.symbol} filtered: Score ${compositeScore}/${minScore}, Social ${alert.socialSignals.overallScore}/${minSocial}, Whale ${alert.whaleActivity.involved}/${whaleRequired}`);
        }
      } catch (tokenError) {
        console.error(`Error validating token ${token.symbol}:`, tokenError);
        // Continue to next token
      }
    }

    console.log(`Scan complete. Scanned: ${scannedCount}, Valid: ${validCount}, Alerts: ${alerts.length}`);

    return NextResponse.json({
      success: true,
      scanned: scannedCount,
      valid: validCount,
      alerts
    });

  } catch (error) {
    console.error('Scan API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}