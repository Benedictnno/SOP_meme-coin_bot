// lib/optimizations/social-signals.ts
// Phase 4: Real social signals sourced from DexScreener token data.
// The prior mock implementation used Math.random() which corrupted composite scores.

import { TokenData } from '@/types';

export interface SocialSignals {
  twitterPresent: boolean;
  telegramPresent: boolean;
  websitePresent: boolean;
  overallScore: number;
  sentiment: string;
  twitterMentions: number; // kept for interface compat, always 0
}

/**
 * Derive social signal quality directly from the token's on-chain social links
 * (sourced from DexScreener pair.info.socials). No random data involved.
 */
export function getSocialSignalsFromToken(token: TokenData): SocialSignals {
  const socials = token.socials ?? {};
  let score = 10; // base

  if (socials.website)  score += 20;
  if (socials.twitter)  score += 25;
  if (socials.telegram) score += 20;

  // Bonus for having all three
  if (socials.website && socials.twitter && socials.telegram) score += 15;

  // Bonus for website being a real domain (not just a linktree)
  if (socials.website && !socials.website.includes('linktr')) score += 10;

  score = Math.min(100, score);

  return {
    twitterPresent: !!socials.twitter,
    telegramPresent: !!socials.telegram,
    websitePresent: !!socials.website,
    overallScore: score,
    sentiment: score > 70 ? 'bullish' : score > 40 ? 'neutral' : 'weak',
    twitterMentions: 0
  };
}

/**
 * Async wrapper kept for backward-compatibility with any existing callers.
 * Prefer getSocialSignalsFromToken when you already have a TokenData object.
 */
export async function getSocialSignals(token: TokenData): Promise<SocialSignals> {
  return getSocialSignalsFromToken(token);
}

/**
 * Calculate if social signals indicate early detection
 */
export function isEarlySignal(signals: SocialSignals): {
  isEarly: boolean;
  reasoning: string;
} {
  if (!signals.twitterPresent && !signals.telegramPresent) {
    return {
      isEarly: true,
      reasoning: 'No social presence yet — potentially very early'
    };
  }

  if (signals.overallScore >= 80) {
    return {
      isEarly: false,
      reasoning: 'Full social setup — established project'
    };
  }

  return {
    isEarly: true,
    reasoning: 'Partial social presence — gaining traction'
  };
}