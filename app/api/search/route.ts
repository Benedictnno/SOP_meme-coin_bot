import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { searchTokens, getTokenDetails } from '@/lib/validators/dexscreener';
import { createEnhancedAlert } from '@/lib/validation-utils';
import { getUserById, hasActiveSubscription } from '@/lib/users';
import { BotSettings } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/search?q=<query>
 * Search for tokens by name, symbol, or address and validate them
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized. Please sign in.' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');

        if (!query) {
            return NextResponse.json(
                { success: false, error: 'Search query is required' },
                { status: 400 }
            );
        }

        const userId = (session.user as any).id;
        const user = await getUserById(userId);

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found.' },
                { status: 404 }
            );
        }

        // Check Subscription / Free Trial
        const isSubscribed = await hasActiveSubscription(user);
        if (!isSubscribed) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Subscription expired',
                    message: 'Your 21-day free trial has expired. Please subscribe with SOL to continue.'
                },
                { status: 403 }
            );
        }

        // Default settings for validation
        const settings: BotSettings = user.settings || {
            minLiquidity: 50000,
            maxTopHolderPercent: 10,
            minVolumeIncrease: 200,
            scanInterval: 300,
            enableTelegramAlerts: false,
            aiMode: 'balanced'
        };

        console.log(`User ${user.email} searching for: ${query}`);

        // If query looks like a mint address, try getting details directly first
        let discoveredTokens = [];
        if (query.length >= 32 && !query.includes(' ')) {
            const directToken = await getTokenDetails(query);
            if (directToken) {
                discoveredTokens.push(directToken);
            }
        }

        // Also perform search
        const searchResults = await searchTokens(query);

        // Merge and deduplicate
        const allTokens = [...discoveredTokens];
        for (const result of searchResults) {
            if (!allTokens.some(t => t.mint === result.mint)) {
                allTokens.push(result);
            }
        }

        const results = [];
        // Validate each found token (limit to first 5 for speed)
        for (const token of allTokens.slice(0, 5)) {
            try {
                const alert = await createEnhancedAlert(token, settings);
                results.push(alert);
            } catch (error) {
                console.error(`Error validating search result ${token.symbol}:`, error);
            }
        }

        return NextResponse.json({
            success: true,
            query,
            results
        });

    } catch (error) {
        console.error('Search API Error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
