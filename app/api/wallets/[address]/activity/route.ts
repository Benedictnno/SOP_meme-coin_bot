import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getWalletActivity } from '@/lib/validators/helius';
import { createEnhancedAlert } from '@/lib/validation-utils';
import { getUserById } from '@/lib/users';
import { BotSettings } from '@/types';
import { getTokenDetails } from '@/lib/validators/dexscreener';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/wallets/[address]/activity
 * Fetch recent activity for a wallet and validate the tokens involved
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
        const userId = (session.user as any).id;
        const user = await getUserById(userId);

        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        // Default settings
        const settings: BotSettings = user.settings || {
            minLiquidity: 20000,
            maxTopHolderPercent: 10,
            minVolumeIncrease: 100,
            scanInterval: 300,
            enableTelegramAlerts: false,
            aiMode: 'balanced'
        };

        // 1. Fetch raw swaps from Helius
        const activity = await getWalletActivity(address);

        // 2. Validate tokens involved in swaps (limit to last 5 unique tokens)
        const processedActivity = [];
        const validatedTokens = new Map();

        for (const swap of activity.slice(0, 10)) {
            if (!swap.tokenMint) {
                processedActivity.push(swap);
                continue;
            }

            // Check if we already validated this token in this request
            if (validatedTokens.has(swap.tokenMint)) {
                processedActivity.push({
                    ...swap,
                    validation: validatedTokens.get(swap.tokenMint)
                });
                continue;
            }

            try {
                // Get detailed token data for validation
                const token = await getTokenDetails(swap.tokenMint);
                if (token) {
                    const validation = await createEnhancedAlert(token, settings);
                    validatedTokens.set(swap.tokenMint, validation);

                    // Update swap metadata if it was unknown
                    const enrichedSwap = {
                        ...swap,
                        tokenSymbol: swap.tokenSymbol === 'UNKNOWN' ? token.symbol : swap.tokenSymbol,
                        validation
                    };

                    processedActivity.push(enrichedSwap);
                } else {
                    processedActivity.push(swap);
                }

            } catch (error) {
                console.error(`Error validating token ${swap.tokenMint} in wallet activity:`, error);
                processedActivity.push(swap);
            }
        }

        return NextResponse.json({
            success: true,
            address,
            activity: processedActivity
        });

    } catch (error) {
        console.error('Wallet activity API error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
