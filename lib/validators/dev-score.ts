// lib/validators/dev-score.ts
import { TokenData } from '@/types';

/**
 * Get the wallet that created the token
 */
export async function getTokenCreator(mintAddress: string): Promise<string | null> {
    const rpcUrl = process.env.HELIUS_RPC_URL || process.env.NEXT_PUBLIC_HELIUS_RPC_URL;
    if (!rpcUrl) return null;

    try {
        // Find the earliest signature for this mint
        const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'get-creator',
                method: 'getSignaturesForAddress',
                params: [mintAddress, { limit: 100 }] // Often the first 100 is enough to find the creation
            })
        });

        const data = await response.json();
        if (data.error || !data.result || data.result.length === 0) return null;

        // The very last signature in the list (oldest) is usually the creation
        const oldestSig = data.result[data.result.length - 1].signature;

        const txResponse = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'get-tx',
                method: 'getTransaction',
                params: [oldestSig, { maxSupportedTransactionVersion: 0, encoding: 'jsonParsed' }]
            })
        });

        const txData = await txResponse.json();
        if (txData.error || !txData.result) return null;

        // In most cases, the first signer is the creator
        return txData.result.transaction.message.accountKeys[0].pubkey;

    } catch (error) {
        console.error('Error getting token creator:', error);
        return null;
    }
}

/**
 * Calculate Developer Credit Score based on on-chain history
 */
export async function getDeveloperCreditScore(creatorAddress: string): Promise<{
    score: number;
    reputation: 'High' | 'Medium' | 'Low' | 'New';
    previousTokens: number;
    ruggedTokens: number;
    details: string[];
}> {
    const rpcUrl = process.env.HELIUS_RPC_URL || process.env.NEXT_PUBLIC_HELIUS_RPC_URL;
    if (!rpcUrl) return { score: 50, reputation: 'New', previousTokens: 0, ruggedTokens: 0, details: [] };

    try {
        // Use DAS API to get tokens created by this wallet
        const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'get-assets-by-creator',
                method: 'getAssetsByCreator',
                params: {
                    creatorAddress,
                    onlyVerified: false,
                    limit: 100
                }
            })
        });

        const data = await response.json();
        const assets = data.result?.items || [];

        const details: string[] = [];
        let score = 50; // Base score
        let ruggedTokens = 0;

        if (assets.length === 0) {
            return { score: 50, reputation: 'New', previousTokens: 0, ruggedTokens: 0, details: ['Brand new developer wallet'] };
        }

        // Filter out the current asset if it's in the list (not always returned yet)
        const previousAssets = assets.filter((asset: any) => asset.authorities?.some((auth: any) => auth.address === creatorAddress));
        const tokenCount = previousAssets.length;

        // Logic for scoring:
        // 1. More previous tokens = more experience
        score += Math.min(tokenCount * 5, 25);

        // 2. Rug detection (Very simplistic for now: if liquidity is gone or supply is highly concentrated)
        // In a real app, we'd check the current state of those tokens
        // For now, let's just check the number of tokens

        if (tokenCount > 10) {
            details.push(`Serial developer: ${tokenCount} previous launches`);
        } else if (tokenCount > 0) {
            details.push(`Experienced developer: ${tokenCount} previous launches`);
        }

        let reputation: 'High' | 'Medium' | 'Low' | 'New' = 'New';
        if (tokenCount > 5) reputation = 'High';
        else if (tokenCount > 1) reputation = 'Medium';
        else reputation = 'Low';

        // Cap score
        score = Math.max(0, Math.min(100, score));

        return {
            score,
            reputation,
            previousTokens: tokenCount,
            ruggedTokens: 0, // Placeholder
            details
        };

    } catch (error) {
        console.error('Error calculating dev score:', error);
        return { score: 50, reputation: 'New', previousTokens: 0, ruggedTokens: 0, details: ['Error analyzing history'] };
    }
}
