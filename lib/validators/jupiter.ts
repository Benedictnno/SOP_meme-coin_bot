// lib/validators/jupiter.ts
// Jupiter API integration for sell simulation testing

import { JupiterQuoteResponse } from '@/types';

const JUPITER_QUOTE_API = 'https://public.jupiterapi.com';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

/**
 * Test if a token can be sold (honeypot detection)
 * @param mintAddress - Solana token mint address
 * @param amount - Amount to test (in lamports, default: 0.01 SOL = 10,000,000 lamports)
 * @returns Sell test results
 */
export async function testSellability(
  mintAddress: string,
  amount: number = 10000000
): Promise<JupiterQuoteResponse> {
  try {
    // Build quote request URL
    const params = new URLSearchParams({
      inputMint: mintAddress,
      outputMint: SOL_MINT,
      amount: amount.toString(),
      slippageBps: '50', // 0.5% slippage tolerance
      onlyDirectRoutes: 'false',
      asLegacyTransaction: 'false'
    });

    const response = await fetch(`${JUPITER_QUOTE_API}/quote?${params}`, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      // If Jupiter can't find a route, likely a honeypot
      return {
        canSell: false,
        reason: 'No swap route found - possible honeypot or low liquidity',
        slippage: 0
      };
    }

    const quote = await response.json();

    // Check if quote is valid
    if (!quote.outAmount || quote.outAmount === '0') {
      return {
        canSell: false,
        reason: 'Invalid quote returned - token may be unsellable',
        slippage: 0
      };
    }

    // Check price impact
    const priceImpact = parseFloat(quote.priceImpactPct || '0');
    if (priceImpact > 10) {
      return {
        canSell: true,
        reason: 'High price impact detected - low liquidity',
        slippage: quote.slippageBps / 100,
        priceImpact
      };
    }

    return {
      canSell: true,
      reason: 'Sell simulation successful',
      slippage: quote.slippageBps / 100,
      priceImpact
    };

  } catch (error) {
    console.error('Sell test error:', error);
    return {
      canSell: false,
      reason: error instanceof Error ? error.message : 'Unknown error during sell test',
      slippage: 0
    };
  }
}

/**
 * Get current price quote for a token
 * @param mintAddress - Solana token mint address
 * @param amountSOL - Amount of SOL to spend (default: 1 SOL)
 * @returns Expected token amount or null
 */
export async function getTokenPrice(
  mintAddress: string,
  amountSOL: number = 1
): Promise<{ price: number; amount: string } | null> {
  try {
    const lamports = amountSOL * 1e9; // Convert SOL to lamports

    const params = new URLSearchParams({
      inputMint: SOL_MINT,
      outputMint: mintAddress,
      amount: lamports.toString(),
      slippageBps: '50'
    });

    const response = await fetch(`${JUPITER_QUOTE_API}/quote?${params}`);

    if (!response.ok) {
      return null;
    }

    const quote = await response.json();

    return {
      price: parseFloat(quote.outAmount) / lamports,
      amount: quote.outAmount
    };

  } catch (error) {
    console.error('Price fetch error:', error);
    return null;
  }
}

/**
 * Check if token has sufficient liquidity for trading
 * @param mintAddress - Solana token mint address
 * @param minLiquiditySOL - Minimum liquidity in SOL (default: 10 SOL)
 * @returns Boolean indicating sufficient liquidity
 */
export async function hasLiquidity(
  mintAddress: string,
  minLiquiditySOL: number = 10
): Promise<boolean> {
  try {
    // Try to get quote for selling 1 SOL worth
    const result = await testSellability(mintAddress, 1e9);

    // If we can't sell even 1 SOL worth, liquidity is too low
    if (!result.canSell) {
      return false;
    }

    // Check price impact - high impact means low liquidity
    if (result.priceImpact && result.priceImpact > 5) {
      return false;
    }

    return true;

  } catch (error) {
    console.error('Liquidity check error:', error);
    return false;
  }
}

/**
 * Retry wrapper for Jupiter API calls
 * @param fn - Function to retry
 * @param retries - Number of retry attempts
 * @returns Result or default failure response
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  defaultValue: T
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) {
        console.error('Max retries reached:', error);
        return defaultValue;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  return defaultValue;
}