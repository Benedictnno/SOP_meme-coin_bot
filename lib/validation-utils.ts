// lib/validation-utils.ts
import { TokenData, BotSettings, EnhancedAlert } from '@/types';
import { validateTokenEnhanced } from './sop-validator';
import { getSocialSignalsFromToken } from './optimizations/social-signals';
import { analyzeTokenNarrative, AIAnalysis } from './validators/gemini';

/**
 * Transforms raw validation results into a comprehensive EnhancedAlert object
 */
export async function getOrCreateAIAnalysis(
    token: TokenData,
    mode: string
): Promise<AIAnalysis | null> {
    const { getDatabase } = await import('@/lib/mongodb');
    const db = await getDatabase();
    const cacheKey = `ai-analysis-${token.mint}-${mode}`;
    const ttlMs = 30 * 60 * 1000; // 30 minute cache

    const cached = await db.collection('app_state').findOne({
        key: cacheKey,
        updatedAt: { $gt: new Date(Date.now() - ttlMs) }
    });

    if (cached) {
        return JSON.parse(cached.value);
    }

    const analysis = await analyzeTokenNarrative(token, mode as any);

    if (analysis) {
        await db.collection('app_state').updateOne(
            { key: cacheKey },
            { $set: { key: cacheKey, value: JSON.stringify(analysis), updatedAt: new Date() } },
            { upsert: true }
        );
    }

    return analysis;
}

/**
 * Transforms raw validation results into a comprehensive EnhancedAlert object
 */
export async function createEnhancedAlert(
    token: TokenData,
    settings: BotSettings,
    skipBundleDetector: boolean = false
): Promise<EnhancedAlert> {
    const validationResult = await validateTokenEnhanced(token, settings, skipBundleDetector);

    // ---------------------------------------------------------------------------
    // Composite score — recalibrated weights that spread scores across 0-100
    // ---------------------------------------------------------------------------
    const rugScore       = validationResult.rugCheckScore;           // 0-100
    const narrativeScore = validationResult.enhancements.aiAnalysis?.narrativeScore
                        ?? validationResult.enhancements.narrativeQuality.score; // 0-100

    // Use only AI hype score; skip mock social score (Phase 1.3 fix)
    const hypeScore  = validationResult.enhancements.aiAnalysis?.hypeScore ?? 50; // 0-100

    // Use real DexScreener social signals (Phase 4.1)
    const realSocials    = getSocialSignalsFromToken(token);
    const socialOverride = realSocials.overallScore; // deterministic, no random
    const whaleScore     = validationResult.enhancements.whaleActivity.score;    // 0-100

    // Weighted average — weights sum to 1.0
    let compositeScore = (
        (rugScore       * 0.35) +  // Contract safety is most important
        (narrativeScore * 0.30) +  // AI narrative quality
        (hypeScore      * 0.20) +  // Hype/social momentum
        (whaleScore     * 0.15)    // Whale involvement
    );

    // Apply penalties (these push scores below 50 for bad tokens)
    if (!validationResult.enhancements.freshness.isFresh)        compositeScore -= 15;
    if (!validationResult.enhancements.txPatterns.isOrganic)     compositeScore -= 25;
    if (!validationResult.enhancements.marketContext.isRiskOn)   compositeScore -= 10;
    if (validationResult.enhancements.bundleAnalysis.isBundled)  compositeScore -= 35;
    if (!validationResult.checks.sellTest)                       compositeScore -= 30;
    if (!validationResult.checks.contract)                       compositeScore -= 20;
    if (validationResult.enhancements.devScore && validationResult.enhancements.devScore.score < 20) compositeScore -= 15;

    compositeScore = Math.max(0, Math.min(100, Math.round(compositeScore)));

    // Expose merged social signals (AI hype + real DexScreener) for alert display
    const mergedSocialScore = Math.round((hypeScore + socialOverride) / 2);

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
    
    if (validationResult.enhancements.whaleActivity.involved) {
        let whaleDetails = '🐋 Whale Wallets Involved';
        if (validationResult.enhancements.whaleActivity.wallets && validationResult.enhancements.whaleActivity.wallets.length > 0) {
            whaleDetails += ` (${validationResult.enhancements.whaleActivity.wallets.length} tracked whales)`;
            // We could lookup the DB here for specific winrates, but to keep alert creation purely synchronous to its params:
            recommendations.push(whaleDetails);
        } else {
            recommendations.push(whaleDetails);
        }
    }
    if (validationResult.enhancements.bundleAnalysis.isBundled) recommendations.push('⛔ BUNDLED LAUNCH - Avoid');
    if (validationResult.enhancements.devScore && validationResult.enhancements.devScore.reputation === 'High') recommendations.push('⭐ Trusted Developer History');

    // AI analysis integration
    if (validationResult.enhancements.aiAnalysis) {
        // More prominent AI recommendation
        recommendations.push(`🤖 AI Verdict: ${validationResult.enhancements.aiAnalysis.sentiment.toUpperCase()} - ${validationResult.enhancements.aiAnalysis.summary}`);

        // Add intelligence brief if Gemini provided it
        if (validationResult.enhancements.aiAnalysis.intelligenceBrief && validationResult.enhancements.aiAnalysis.intelligenceBrief.length > 0) {
            validationResult.enhancements.aiAnalysis.intelligenceBrief.forEach(brief => {
                recommendations.push(`💡 Insight: ${brief}`);
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
        socialSignals: {
            twitterMentions: realSocials.twitterMentions,
            sentiment: realSocials.sentiment,
            overallScore: mergedSocialScore
        },
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

    // Persistence: Save to database if valid and score >= 30
    if (isValid && compositeScore >= 30) {
        try {
            const { getDatabase } = await import('@/lib/mongodb');
            const db = await getDatabase();

            // Upsert into main signals collection (dashboard feed)
            await db.collection('signals').updateOne(
                { 'token.mint': token.mint },
                { $set: alert },
                { upsert: true }
            );

            // Write to delivery queue (notifier reads this). $setOnInsert prevents
            // re-queueing a token that is already pending delivery.
            await db.collection('delivery_queue').updateOne(
                { mint: token.mint },
                {
                    $setOnInsert: {
                        alert,
                        mint: token.mint,
                        compositeScore: alert.compositeScore,
                        createdAt: new Date(),
                        delivered: false,
                        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1-hour TTL
                    }
                },
                { upsert: true }
            );
        } catch (dbError) {
            console.error('[Persistence] Failed to save signal:', dbError);
        }
    }

    return alert;
}
