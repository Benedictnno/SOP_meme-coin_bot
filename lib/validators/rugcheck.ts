// lib/validators/rugcheck.ts
// RugCheck API integration for contract safety validation

import { RugCheckResponse } from '@/types';

const RUGCHECK_BASE = 'https://api.rugcheck.xyz/v1';

/**
 * Validate token contract safety using RugCheck
 * @param mintAddress - Solana token mint address
 * @returns Validation results with risks and score
 */
export async function validateContract(mintAddress: string): Promise<RugCheckResponse> {
  try {
    const response = await fetch(`${RUGCHECK_BASE}/tokens/${mintAddress}/report`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.warn(`RugCheck API error: ${response.status} for ${mintAddress}`);
      return {
        verified: false,
        risks: ['API error or token not found'],
        score: 0
      };
    }
    
    const data = await response.json();
    
    // Extract risks array (RugCheck returns various risk indicators)
    const risks: string[] = [];
    
    if (data.risks && Array.isArray(data.risks)) {
      risks.push(...data.risks.map((r: any) => r.name || r.description || 'Unknown risk'));
    }
    
    // Check for critical flags
    if (data.freezeAuthority) {
      risks.push('Freeze authority enabled');
    }
    
    if (data.mintAuthority) {
      risks.push('Mint authority enabled');
    }
    
    if (data.isLpBurned === false) {
      risks.push('Liquidity not burned');
    }
    
    if (data.isLpLocked === false && data.isLpBurned === false) {
      risks.push('Liquidity not locked or burned');
    }
    
    // Extract top holders if available
    const topHolders = data.topHolders?.map((holder: any) => ({
      address: holder.address,
      percentage: holder.percentage || 0
    })) || [];
    
    return {
      verified: risks.length === 0,
      risks,
      score: data.score || (risks.length === 0 ? 100 : Math.max(0, 100 - (risks.length * 20))),
      topHolders
    };
    
  } catch (error) {
    console.error('RugCheck validation error:', error);
    return {
      verified: false,
      risks: ['Validation failed: ' + (error instanceof Error ? error.message : 'Unknown error')],
      score: 0
    };
  }
}

/**
 * Quick safety check (faster than full report)
 * @param mintAddress - Solana token mint address
 * @returns Boolean indicating if token is safe
 */
export async function quickSafetyCheck(mintAddress: string): Promise<boolean> {
  try {
    const result = await validateContract(mintAddress);
    return result.verified && result.score > 50;
  } catch (error) {
    console.error('Quick safety check error:', error);
    return false;
  }
}

/**
 * Retry wrapper for RugCheck API calls
 * @param fn - Function to retry
 * @param retries - Number of retry attempts
 * @returns Result or null on failure
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3
): Promise<T | null> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) {
        console.error('Max retries reached:', error);
        return null;
      }
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
  return null;
}