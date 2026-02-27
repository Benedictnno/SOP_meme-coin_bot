// lib/validation-utils.ts
import { TokenData, BotSettings, EnhancedAlert } from '@/types';
import { validateTokenEnhanced } from './sop-validator';

/**
 * Transforms raw validation results into a comprehensive EnhancedAlert object
 */
export async function createEnhancedAlert(
    token: TokenData,
    settings: BotSettings
): Promise<EnhancedAlert> {
    const validationResult = await validateTokenEnhanced(token, settings);

    // Calculate composite score
    const baseScore = validationResult.rugCheckScore * 0.4;

    // ENHANCEMENT: Use granular AI scores if available to avoid rounded "60/80" bias
    const rawNarrativeScore = validationResult.enhancements.aiAnalysis?.narrativeScore ??
        validationResult.enhancements.narrativeQuality.score;

    const narrativeScore = rawNarrativeScore * 0.2;

    const rawSocialScore = validationResult.enhancements.aiAnalysis?.hypeScore ??
        validationResult.enhancements.socialSignals.overallScore;

    const socialScore = rawSocialScore;
    const whaleScore = validationResult.enhancements.whaleActivity.score;
    const liquidityScore = validationResult.enhancements.liquidityStability.isStable ? 100 : 0;

    let compositeScore = baseScore + narrativeScore + (socialScore * 0.15) + (whaleScore * 0.05) + (liquidityScore * 0.2);

    // Penalties
    if (!validationResult.enhancements.freshness.isFresh) compositeScore -= 10;
    if (!validationResult.enhancements.txPatterns.isOrganic) compositeScore -= 20;
    if (!validationResult.enhancements.marketContext.isRiskOn) compositeScore -= 10;
    if (validationResult.enhancements.bundleAnalysis.isBundled) compositeScore -= 30;
    if (validationResult.enhancements.devScore && validationResult.enhancements.devScore.score < 20) compositeScore -= 20;

    compositeScore = Math.max(0, Math.min(100, Math.round(compositeScore)));

    const isValid = validationResult.checks.narrative &&
        validationResult.checks.liquidity &&
        validationResult.checks.contract &&
        validationResult.checks.sellTest;

    // Recommendations
    const recommendations = [];
    if (compositeScore >= 80) recommendations.push('🟢 STRONG BUY - All signals Aligned');
    else if (compositeScore >= 70) recommendations.push('🟢 BUY - High confidence setup');
    else if (compositeScore >= 60) recommendations.push('🟡 MODERATE - Exercise caution');
    else recommendations.push('🔴 AVOID - High risk');

    if (validationResult.enhancements.txPatterns.suspiciousPatterns.length > 0) recommendations.push('⚠️ Suspicious Patterns Detected');
    if (validationResult.enhancements.whaleActivity.involved) recommendations.push('🐋 Whale Wallets Involved');
    if (validationResult.enhancements.bundleAnalysis.isBundled) recommendations.push('⛔ BUNDLED LAUNCH - Avoid');
    if (validationResult.enhancements.devScore && validationResult.enhancements.devScore.reputation === 'High') recommendations.push('⭐ Trusted Developer History');

    // AI analysis integration
    if (validationResult.enhancements.aiAnalysis) {
        recommendations.push(`🤖 AI Summary: ${validationResult.enhancements.aiAnalysis.summary}`);

        // Add intelligence brief if Gemini provided it
        if (validationResult.enhancements.aiAnalysis.intelligenceBrief) {
            validationResult.enhancements.aiAnalysis.intelligenceBrief.forEach(brief => {
                recommendations.push(`💡 Brief: ${brief}`);
            });
        }

        if (validationResult.enhancements.aiAnalysis.potential === 'moonshot') {
            recommendations.push('🚀 AI High Potential Detected');
        }
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
        bundleAnalysis: validationResult.enhancements.bundleAnalysis,
        aiAnalysis: validationResult.enhancements.aiAnalysis ? {
            ...validationResult.enhancements.aiAnalysis,
            mode: settings.aiMode
        } : undefined,
        tierReached: validationResult.tierReached
    };

    // Persistence: Save to database if valid (background workers can fill the dashboard)
    if (isValid) {
        try {
            const { getDatabase } = await import('@/lib/mongodb');
            const db = await getDatabase();
            await db.collection('signals').updateOne(
                { 'token.mint': token.mint },
                { $set: alert },
                { upsert: true }
            );
        } catch (dbError) {
            console.error('[Persistence] Failed to save signal:', dbError);
        }
    }

    return alert;
}
