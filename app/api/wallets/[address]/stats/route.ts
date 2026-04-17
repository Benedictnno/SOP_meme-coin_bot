import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getDatabase } from '@/lib/mongodb';
import { WalletPnL } from '@/lib/optimizations/whale-tracker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/wallets/[address]/stats
 * Returns aggregated PnL and portfolio data for a specific wallet
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { address: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { address } = params;
        const db = await getDatabase();

        // 1. Fetch all PnL records for this wallet
        const pnlData = await db.collection<WalletPnL>('wallet_pnl')
            .find({ walletAddress: address })
            .sort({ lastUpdated: -1 })
            .toArray();

        // 2. Aggregate stats
        const stats = {
            totalRealizedPnL: 0,
            totalInvested: 0,
            winCount: 0,
            lossCount: 0,
            openPositions: 0,
            bestToken: null as any,
            portfolio: [] as any[]
        };

        let maxPnL = -Infinity;

        pnlData.forEach(p => {
            stats.totalRealizedPnL += (p.realizedPnL || 0);
            stats.totalInvested += (p.totalInvestedSol || 0);
            
            if (p.status === 'open') {
                stats.openPositions++;
                stats.portfolio.push({
                    mint: p.tokenMint,
                    symbol: p.tokenSymbol,
                    amount: p.tokensAccumulated,
                    invested: p.totalInvestedSol,
                    avgEntry: p.averageEntryAmount,
                    lastUpdated: p.lastUpdated
                });
            }

            if (p.realizedPnL > 0) stats.winCount++;
            else if (p.realizedPnL < 0) stats.lossCount++;

            if (p.realizedPnL > maxPnL) {
                maxPnL = p.realizedPnL;
                stats.bestToken = {
                    symbol: p.tokenSymbol,
                    pnl: p.realizedPnL
                };
            }
        });

        // 3. Fetch global whale performance if it exists
        const whalePerformance = await db.collection('whale_wallets').findOne({ address });

        return NextResponse.json({
            success: true,
            summary: {
                realizedPnL: stats.totalRealizedPnL,
                totalInvested: stats.totalInvested,
                winRate: (stats.winCount + stats.lossCount) > 0 
                    ? (stats.winCount / (stats.winCount + stats.lossCount)) * 100 
                    : 0,
                openPositionsCount: stats.openPositions,
                bestToken: stats.bestToken
            },
            portfolio: stats.portfolio,
            whalePerformance: whalePerformance ? {
                winRate: whalePerformance.winRate,
                avgReturn: whalePerformance.avgReturn,
                nickname: whalePerformance.nickname,
                successfulTrades: whalePerformance.successfulTrades
            } : null
        });

    } catch (error) {
        console.error('Wallet stats error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
