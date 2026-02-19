// types/index.ts
// Core type definitions for the Solana Meme Coin Alert Bot

/**
 * Token data structure from DEX Screener and validation pipeline
 */
export interface TokenData {
  symbol: string;
  mint: string;
  name: string;
  narrative: string;
  liquidity: number;
  volumeIncrease: number;
  topHolderPercent: number;
  priceUSD: string;
  marketCap: number;
  pairAddress?: string;
  volume1h?: number;
  volume6h?: number;
  volume24h?: number;
  volumeTotal?: number;
  priceChange1h?: number;
  priceChange24h?: number;
  socials?: {
    twitter?: string;
    telegram?: string;
    website?: string;
  };
}

/**
 * SOP validation checklist (all must pass for valid setup)
 */
export interface ValidationChecks {
  narrative: boolean;      // Clear narrative exists
  attention: boolean;      // Fresh attention (volume spike)
  liquidity: boolean;      // Clean liquidity (>threshold)
  volume: boolean;         // Organic volume (not manipulation)
  contract: boolean;       // Contract verified (no risks)
  holders: boolean;        // Holder distribution (not centralized)
  sellTest: boolean;       // Sell simulation passed (not honeypot)
}

/**
 * Complete alert object with validation results
 */
export interface Alert {
  id: string;
  timestamp: string;
  token: TokenData;
  checks: ValidationChecks;
  isValid: boolean;
  passedChecks: number;
  totalChecks: number;
  setupType: 'Base Break' | 'Pullback Entry';
  rugCheckScore: number;
  risks?: string[];
}

/**
 * Enhanced alert object with composite scoring
 */
export interface EnhancedAlert {
  id: string;
  timestamp: string;
  token: TokenData;
  checks: ValidationChecks;
  isValid: boolean;
  passedChecks: number;
  totalChecks: number;
  setupType: 'Base Break' | 'Pullback Entry';
  rugCheckScore: number;
  compositeScore: number;
  socialSignals: {
    twitterMentions: number;
    sentiment: string;
    overallScore: number;
  };
  whaleActivity: {
    involved: boolean;
    confidence: number;
    score: number;
  };
  timeMultiplier: number;
  recommendations: string[];
  risks: string[];
  devScore?: {
    score: number;
    reputation: string;
    details: string[];
  };
  bundleAnalysis?: {
    isBundled: boolean;
    bundlePercentage: number;
    sybilCount: number;
    details: string[];
  };
  aiAnalysis?: {
    narrativeScore: number;
    hypeScore: number;
    sentiment: 'bullish' | 'neutral' | 'bearish';
    summary: string;
    risks: string[];
    potential: string;
    mode?: string;
  };
}

/**
 * Bot configuration settings
 */
export interface BotSettings {
  minLiquidity: number;
  maxTopHolderPercent: number;
  minVolumeIncrease: number;
  scanInterval: number;
  enableTelegramAlerts: boolean;
  telegramBotToken?: string;
  telegramChatId?: string;
  minCompositeScore?: number;
  minSocialScore?: number;
  whaleOnly?: boolean;
  aiMode?: 'conservative' | 'balanced' | 'aggressive';
}

/**
 * Scan API response
 */
export interface ScanResponse {
  success: boolean;
  scanned: number;
  valid: number;
  alerts: EnhancedAlert[];
  error?: string;
}

/**
 * RugCheck API response
 */
export interface RugCheckResponse {
  verified: boolean;
  risks: string[];
  score: number;
  topHolders?: Array<{
    address: string;
    percentage: number;
  }>;
}

/**
 * Jupiter quote response (simplified)
 */
export interface JupiterQuoteResponse {
  canSell: boolean;
  reason: string;
  slippage: number;
  priceImpact?: number;
}

/**
 * Helius holder distribution response
 */
export interface HolderDistribution {
  topHolderPercent: number;
  holderCount: number;
}

/**
 * DEX Screener pair data (simplified)
 */
export interface DexPair {
  chainId: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  liquidity: {
    usd: number;
  };
  volume: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  priceUsd: string;
  fdv: number;
  priceChange?: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  info?: {
    imageUrl?: string;
    websites?: Array<{
      label?: string;
      url: string;
    }>;
    socials?: Array<{
      type: string;
      url: string;
    }>;
  };
}
/**
 * Tracked wallet structure
 */
export interface TrackedWallet {
  _id?: any;
  userId: string;
  address: string;
  label?: string;
  createdAt: string;
  lastNotifiedTx?: string;
}

/**
 * Wallet activity (swap) structure
 */
export interface WalletActivity {
  signature: string;
  timestamp: string;
  type: 'buy' | 'sell';
  tokenMint: string;
  tokenSymbol: string;
  solAmount: number;
  tokenAmount: number;
  priceUSD?: number;
}
