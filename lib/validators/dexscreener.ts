// lib/validators/dexscreener.ts
// DEX Screener API integration for token discovery

import { TokenData, DexPair } from '@/types';

const DEX_SCREENER_BASE = 'https://api.dexscreener.com/latest/dex';

/**
 * Scan DEX Screener for Solana tokens with volume spikes
 * @param volumeThreshold - Minimum volume increase percentage (default: 200%)
 * @returns Array of tokens matching criteria
 */
export async function scanDEXScreener(volumeThreshold: number = 200): Promise<TokenData[]> {
  try {
    // Fetch latest Solana pairs with minimum liquidity
    // Using search endpoint as discovery source
    // Discovery: Search for common Solana DEX names and identifiers 
    // This is much more effective than searching for "solana" which returns scams on other chains
    const searchQueries = [
      'raydium',     // Primary Solana DEX
      'meteora',     // Popular Solana LP
      'pump.fun',    // Solana meme launcher
      'orca'         // Another Solana DEX
    ];

    let allPairs: any[] = [];

    // Fetch from multiple queries to build a pool
    for (const query of searchQueries) {
      try {
        console.log(`Searching DexScreener for: ${query}...`);
        const response = await fetch(`${DEX_SCREENER_BASE}/search?q=${query}`, {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(5000)
        });
        const data = await response.json();
        if (data.pairs) allPairs = [...allPairs, ...data.pairs];
      } catch (err) {
        console.warn(`Search failed for ${query}`);
      }
    }

    if (allPairs.length === 0) {
      console.warn('No pairs found in any search query');
      return [];
    }

    // Deduplicate pairs by base token address (mint)
    // This ensures we only scan each token once, even if it has multiple pairs
    const uniquePairsMap = new Map();
    allPairs.forEach(p => {
      // If multiple pairs exist for same token, keep the one with higher liquidity
      const existing = uniquePairsMap.get(p.baseToken.address);
      if (!existing || (p.liquidity?.usd || 0) > (existing.liquidity?.usd || 0)) {
        uniquePairsMap.set(p.baseToken.address, p);
      }
    });
    const uniquePairsList = Array.from(uniquePairsMap.values());

    console.log(`Processing ${uniquePairsList.length} unique pairs from multi-query search`);

    // Debug: Log chain distribution
    const chainCounts: Record<string, number> = {};
    uniquePairsList.forEach((p: any) => chainCounts[p.chainId] = (chainCounts[p.chainId] || 0) + 1);
    console.log('Chain distribution:', chainCounts);

    // Filter for volume spikes and Solana chain
    const spikeTokens = uniquePairsList
      .filter((pair: DexPair) => {
        // 1. Must be Solana
        if (pair.chainId !== 'solana') {
          return false;
        }

        // 2. Must have recent volume data
        if (!pair.volume?.h24 || !pair.volume?.h1) {
          console.log(`[Rejection] ${pair.baseToken.symbol}: Missing volume metrics (h1: ${pair.volume?.h1}, h24: ${pair.volume?.h24})`);
          return false;
        }

        // 3. Calculate volume increase (run-rate comparison)
        const volumeChange = pair.volume.h24 > 0
          ? ((pair.volume.h1 * 24) / pair.volume.h24) * 100
          : 0;

        // 4. Check liquidity (Permissive discovery at 1k)
        const liquidity = pair.liquidity?.usd || 0;

        const isSpike = volumeChange >= volumeThreshold;
        const hasLiquidity = liquidity >= 1000;

        if (!isSpike) {
          console.log(`[Rejection] ${pair.baseToken.symbol}: Low volume spike ${volumeChange.toFixed(0)}% (min ${volumeThreshold})`);
          return false;
        }

        if (!hasLiquidity) {
          console.log(`[Rejection] ${pair.baseToken.symbol}: Low liquidity $${liquidity.toFixed(0)} (min 1000)`);
          return false;
        }

        console.log(`[PASS] ${pair.baseToken.symbol}: Spike ${volumeChange.toFixed(0)}%, Liq $${liquidity.toFixed(0)}`);
        return true;
      })
      .slice(0, 10);

    // Transform to TokenData format
    return spikeTokens.map((pair: DexPair): TokenData => {
      const volumeChange = pair.volume.h24 > 0
        ? ((pair.volume.h1 * 24) / pair.volume.h24) * 100
        : 0;

      const socials = {
        twitter: pair.info?.socials?.find((s: any) => s.type === 'twitter')?.url,
        telegram: pair.info?.socials?.find((s: any) => s.type === 'telegram')?.url,
        website: pair.info?.websites?.[0]?.url
      };

      return {
        symbol: pair.baseToken.symbol,
        mint: pair.baseToken.address,
        name: pair.baseToken.name || pair.baseToken.symbol,
        narrative: `Trending on DEX Screener with ${volumeChange.toFixed(0)}% volume increase`,
        liquidity: pair.liquidity?.usd || 0,
        volumeIncrease: volumeChange,
        topHolderPercent: 0, // Will be filled by validator
        priceUSD: pair.priceUsd,
        marketCap: pair.fdv || 0,
        pairAddress: pair.pairAddress,
        volume24h: pair.volume.h24,
        priceChange24h: pair.priceChange?.h24 || 0,
        socials
      };
    });

  } catch (error) {
    console.error('DEX Screener scan error:', error);
    return [];
  }
}

/**
 * Get detailed token information from DEX Screener
 * @param mintAddress - Solana token mint address
 * @returns Token details or null if not found
 */
export async function getTokenDetails(mintAddress: string): Promise<TokenData | null> {
  try {
    const response = await fetch(`${DEX_SCREENER_BASE}/tokens/${mintAddress}`);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data.pairs || data.pairs.length === 0) {
      return null;
    }

    // Use first pair (usually highest liquidity)
    const pair = data.pairs[0] as DexPair;

    return {
      symbol: pair.baseToken.symbol,
      mint: pair.baseToken.address,
      name: pair.baseToken.name || pair.baseToken.symbol,
      narrative: 'Token found on DEX Screener',
      liquidity: pair.liquidity?.usd || 0,
      volumeIncrease: 0,
      topHolderPercent: 0,
      priceUSD: pair.priceUsd,
      marketCap: pair.fdv || 0,
      volume24h: pair.volume?.h24 || 0,
      priceChange24h: pair.priceChange?.h24 || 0
    };

  } catch (error) {
    console.error('Token details fetch error:', error);
    return null;
  }
}

/**
 * Search for tokens by query (symbol or name)
 * @param query - Search term
 * @returns Array of matching tokens
 */
export async function searchTokens(query: string): Promise<TokenData[]> {
  try {
    const response = await fetch(`${DEX_SCREENER_BASE}/search?q=${encodeURIComponent(query)}`);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    if (!data.pairs || !Array.isArray(data.pairs)) {
      return [];
    }

    // Filter for Solana only
    const solanaPairs = data.pairs.filter((pair: DexPair) => pair.chainId === 'solana');

    return solanaPairs.slice(0, 10).map((pair: DexPair): TokenData => ({
      symbol: pair.baseToken.symbol,
      mint: pair.baseToken.address,
      name: pair.baseToken.name || pair.baseToken.symbol,
      narrative: 'Search result from DEX Screener',
      liquidity: pair.liquidity?.usd || 0,
      volumeIncrease: 0,
      topHolderPercent: 0,
      priceUSD: pair.priceUsd,
      marketCap: pair.fdv || 0,
      volume24h: pair.volume?.h24 || 0
    }));

  } catch (error) {
    console.error('Token search error:', error);
    return [];
  }
}