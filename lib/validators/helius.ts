// lib/validators/helius.ts
// Helius RPC integration for holder distribution analysis

import { HolderDistribution } from '@/types';

/**
 * Get holder distribution for a token using Helius RPC
 * @param mintAddress - Solana token mint address
 * @returns Holder distribution data
 */
export async function getHolderDistribution(
  mintAddress: string
): Promise<HolderDistribution> {
  const rpcUrl = process.env.HELIUS_RPC_URL || process.env.NEXT_PUBLIC_HELIUS_RPC_URL;

  if (!rpcUrl) {
    console.error('HELIUS_RPC_URL not configured');
    return {
      topHolderPercent: 100, // Fail-safe: assume worst case
      holderCount: 0
    };
  }

  try {
    // Get largest token accounts
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'holder-check',
        method: 'getTokenLargestAccounts',
        params: [mintAddress]
      })
    });

    if (!response.ok) {
      throw new Error(`Helius RPC error: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      console.error('Helius RPC error:', data.error);
      return {
        topHolderPercent: 100,
        holderCount: 0
      };
    }

    const accounts = data.result?.value || [];

    if (accounts.length === 0) {
      return {
        topHolderPercent: 100,
        holderCount: 0
      };
    }

    // Calculate total supply from all accounts
    const totalSupply = accounts.reduce(
      (sum: number, acc: any) => sum + Number(acc.amount),
      0
    );

    // Get top holder amount
    const topHolderAmount = Number(accounts[0]?.amount || 0);

    // Calculate percentage
    const topHolderPercent = totalSupply > 0
      ? (topHolderAmount / totalSupply) * 100
      : 100;

    return {
      topHolderPercent: Math.round(topHolderPercent * 100) / 100,
      holderCount: accounts.length
    };

  } catch (error) {
    console.error('Holder distribution error:', error);
    return {
      topHolderPercent: 100, // Fail-safe
      holderCount: 0
    };
  }
}

/**
 * Get token supply information
 * @param mintAddress - Solana token mint address
 * @returns Total supply or null on error
 */
export async function getTokenSupply(mintAddress: string): Promise<number | null> {
  const rpcUrl = process.env.HELIUS_RPC_URL || process.env.NEXT_PUBLIC_HELIUS_RPC_URL;

  if (!rpcUrl) {
    return null;
  }

  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'supply-check',
        method: 'getTokenSupply',
        params: [mintAddress]
      })
    });

    const data = await response.json();

    if (data.error || !data.result?.value) {
      return null;
    }

    return Number(data.result.value.amount);

  } catch (error) {
    console.error('Token supply error:', error);
    return null;
  }
}

/**
 * Check if an address is a token account
 * @param address - Solana address to check
 * @returns Boolean indicating if address is a token account
 */
export async function isTokenAccount(address: string): Promise<boolean> {
  const rpcUrl = process.env.HELIUS_RPC_URL || process.env.NEXT_PUBLIC_HELIUS_RPC_URL;

  if (!rpcUrl) {
    return false;
  }

  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'account-check',
        method: 'getAccountInfo',
        params: [address, { encoding: 'jsonParsed' }]
      })
    });

    const data = await response.json();

    if (data.error || !data.result?.value) {
      return false;
    }

    const accountData = data.result.value.data;
    return accountData.program === 'spl-token';

  } catch (error) {
    console.error('Account check error:', error);
    return false;
  }
}

/**
 * Get detailed holder breakdown (top N holders)
 * @param mintAddress - Solana token mint address
 * @param topN - Number of top holders to return (default: 10)
 * @returns Array of top holders with percentages
 */
export async function getTopHolders(
  mintAddress: string,
  topN: number = 10
): Promise<Array<{ address: string; percentage: number; amount: string }>> {
  const rpcUrl = process.env.HELIUS_RPC_URL || process.env.NEXT_PUBLIC_HELIUS_RPC_URL;

  if (!rpcUrl) {
    return [];
  }

  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'top-holders',
        method: 'getTokenLargestAccounts',
        params: [mintAddress]
      })
    });

    const data = await response.json();

    if (data.error || !data.result?.value) {
      return [];
    }

    const accounts = data.result.value;
    const totalSupply = accounts.reduce(
      (sum: number, acc: any) => sum + Number(acc.amount),
      0
    );

    return accounts
      .slice(0, topN)
      .map((acc: any) => ({
        address: acc.address,
        percentage: (Number(acc.amount) / totalSupply) * 100,
        amount: acc.amount
      }));

  } catch (error) {
    console.error('Top holders error:', error);
    return [];
  }
}

/**
 * Check for whale activity in top holders
 * @param mintAddress - Solana token mint address
 * @returns Whale activity status and confidence score
 */
export async function getWhaleActivity(
  mintAddress: string
): Promise<{ involved: boolean; confidence: number; score: number }> {
  try {
    const rpcUrl = process.env.HELIUS_RPC_URL || process.env.NEXT_PUBLIC_HELIUS_RPC_URL;
    if (!rpcUrl) return { involved: false, confidence: 0, score: 0 };

    // 1. Get largest accounts
    const distribution = await getHolderDistribution(mintAddress);

    // Low holder count or extremely concentrated supply often indicates early "dev" buys
    // but not necessarily "smart money" whales
    if (distribution.holderCount < 5) {
      return { involved: false, confidence: 10, score: 10 };
    }

    // 2. Parallel balance checks for top holders
    const topHolders = await getTopHolders(mintAddress, 5);
    const whaleChecks = await Promise.all(
      topHolders.map(async (holder: any) => {
        try {
          const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: `whale-check-${holder.address}`,
              method: 'getAccountInfo',
              params: [holder.address, { encoding: 'jsonParsed' }]
            }),
            signal: AbortSignal.timeout(5000) // 5s timeout
          });

          if (!response.ok) return 0;
          const data = await response.json();
          const lamports = data.result?.value?.lamports || 0;
          return lamports / 1e9;
        } catch (err) {
          console.warn(`Whale check failed for ${holder.address}:`, err);
          return 0;
        }
      })
    );

    const whaleWallets = whaleChecks.filter((balance: number) => balance > 100).length;

    const involved = whaleWallets >= 2;
    const score = involved ? 80 + (whaleWallets * 4) : whaleWallets * 30;
    const confidence = distribution.holderCount > 50 ? 90 : 60;

    return {
      involved,
      confidence: Math.min(100, confidence),
      score: Math.min(100, score)
    };

  } catch (error) {
    console.error('Whale activity check error:', error);
    return { involved: false, confidence: 0, score: 0 };
  }
}

/**
 * Get recent swap activity for a wallet
 * @param address - Solana wallet address
 * @returns Array of wallet activity (swaps)
 */
export async function getWalletActivity(address: string): Promise<any[]> {
  const rpcUrl = process.env.HELIUS_RPC_URL || process.env.NEXT_PUBLIC_HELIUS_RPC_URL;
  if (!rpcUrl) return [];

  // Transform URL to Helius API URL for enriched transactions
  // Helius RPC: https://mainnet.helius-rpc.com/?api-key=KEY
  // Enriched Tx: https://api.helius.xyz/v0/addresses/ADDRESS/transactions?api-key=KEY
  const apiKey = new URL(rpcUrl).searchParams.get('api-key');
  if (!apiKey) return [];

  const apiUrl = `https://api.helius.xyz/v0/addresses/${address}/transactions?api-key=${apiKey}&type=SWAP`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) return [];

    const transactions = await response.json();

    return transactions.map((tx: any) => {
      const swap = tx.events?.swap;
      if (!swap) return null;

      const isBuy = swap.nativeInput !== null; // Buying token with SOL (usually)

      // Try to find the non-SOL token mint/symbol/amount more robustly
      // Sometimes Helius puts SOL in tokenInputs/Outputs too
      const allTokens = [...(swap.tokenInputs || []), ...(swap.tokenOutputs || [])];
      const targetToken = allTokens.find((t: any) =>
        t.mint !== 'So11111111111111111111111111111111111111112' &&
        t.mint !== 'So11111111111111111111111111111111111111111'
      );

      const tokenMint = targetToken?.mint;
      const tokenSymbol = targetToken?.symbol;
      const solAmount = isBuy ? (swap.nativeInput?.amount || 0) / 1e9 : (swap.nativeOutput?.amount || 0) / 1e9;
      const tokenAmount = targetToken?.amount || 0;

      return {
        signature: tx.signature,
        timestamp: new Date(tx.timestamp * 1000).toISOString(),
        type: isBuy ? 'buy' : 'sell',
        tokenMint,
        tokenSymbol: tokenSymbol || 'UNKNOWN',
        solAmount,
        tokenAmount: Number(tokenAmount),
        description: tx.description
      };

    }).filter(Boolean);


  } catch (error) {
    console.error('Wallet activity error:', error);
    return [];
  }
}

