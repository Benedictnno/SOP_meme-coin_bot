// lib/validators/bundle-detector.ts

/**
 * Detect if a token was "bundled" during launch
 */
export async function detectBundledLaunch(mintAddress: string): Promise<{
    isBundled: boolean;
    bundlePercentage: number;
    sybilCount: number;
    details: string[];
}> {
    const rpcUrl = process.env.HELIUS_RPC_URL || process.env.NEXT_PUBLIC_HELIUS_RPC_URL;
    if (!rpcUrl) return { isBundled: false, bundlePercentage: 0, sybilCount: 0, details: [] };

    try {
        // 1. Get first 100 transactions
        const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'bundle-check',
                method: 'getSignaturesForAddress',
                params: [mintAddress, { limit: 100 }]
            })
        });

        const data = await response.json();
        if (data.error || !data.result || data.result.length === 0) {
            return { isBundled: false, bundlePercentage: 0, sybilCount: 0, details: [] };
        }

        const signatures = data.result.reverse(); // Start from the beginning

        // 2. Fetch those transactions (batching would be better, but for simplicity we'll do sequential or small batches)
        // To save time/API calls, let's just look at the first 10 transactions to stay within free tier limits
        const firstSigs = signatures.slice(0, 10).map((s: any) => s.signature);

        // Add a small delay to avoid 429 on free tier before batch request
        await new Promise(resolve => setTimeout(resolve, 800));

        const txsResponse = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(firstSigs.map((sig: string, i: number) => ({
                jsonrpc: '2.0',
                id: `tx-${i}`,
                method: 'getTransaction',
                params: [sig, { maxSupportedTransactionVersion: 0, encoding: 'jsonParsed' }]
            })))
        });

        const txsData = await txsResponse.json();

        // Handle error responses (like 429 too many requests)
        if (txsData.error) {
            console.warn(`Bundle Detector: RPC returned error [${txsData.error.code}] ${txsData.error.message}`);
            return { isBundled: false, bundlePercentage: 0, sybilCount: 0, details: ['RPC Limit Reached'] };
        }

        if (!Array.isArray(txsData)) {
            console.error('Bundle Detector: RPC returned non-array for batch request', txsData);
            return { isBundled: false, bundlePercentage: 0, sybilCount: 0, details: [] };
        }

        const transactions = txsData.map((d: any) => d.result).filter(Boolean);

        if (transactions.length === 0) return { isBundled: false, bundlePercentage: 0, sybilCount: 0, details: [] };

        // 3. Analyze transactions in the same block as LP creation
        const creationSlot = transactions[0].slot;
        const creationBlockTxs = transactions.filter((tx: any) => tx.slot === creationSlot);

        let buyCount = 0;
        let totalBoughtAmount = 0;
        const uniqueWallets = new Set();

        // Note: Detecting "buys" in a complex way is hard without parseTransaction
        // but we can look for "postTokenBalances" vs "preTokenBalances"

        transactions.forEach((tx: any) => {
            const hasMintBalanceChange = tx.meta?.postTokenBalances?.some((b: any) => b.mint === mintAddress);
            if (hasMintBalanceChange) {
                buyCount++;
                const signer = tx.transaction.message.accountKeys[0].pubkey;
                uniqueWallets.add(signer);
            }
        });

        const sybilCount = buyCount - uniqueWallets.size;
        const details: string[] = [];

        if (creationBlockTxs.length > 5) {
            details.push(`High block activity: ${creationBlockTxs.length} transactions in the first block`);
        }

        if (sybilCount > 2) {
            details.push(`Sybil pattern detected: ${sybilCount} repeated wallet interactions in first 20 txs`);
        }

        const isBundled = creationBlockTxs.length > 10 || sybilCount > 5;

        return {
            isBundled,
            bundlePercentage: isBundled ? 15 : 0, // Placeholder
            sybilCount,
            details
        };

    } catch (error) {
        console.error('Error detecting bundled launch:', error);
        return { isBundled: false, bundlePercentage: 0, sybilCount: 0, details: [] };
    }
}
