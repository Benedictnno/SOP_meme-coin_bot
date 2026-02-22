import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

export async function POST(request: Request) {
    try {
        const { messages, tokenContext } = await request.json();

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ message: 'AI configuration missing. Please check API keys.' }, { status: 500 });
        }

        const lastUserMessage = messages[messages.length - 1].content;

        // Construct System Context
        const systemContext = `
        You are an expert crypto analyst AI within the "SOP MemeScanner" dashboard.
        You are analyzing the token: ${tokenContext.name} ($${tokenContext.symbol}).
        
        TOKEN CONTEXT:
        - Mint Address: ${tokenContext.mint}
        - Price: $${tokenContext.priceUSD || 'Unknown'}
        - Liquidity: $${(tokenContext.liquidity / 1000).toFixed(1)}k
        - Market Cap: $${(tokenContext.marketCap / 1000).toFixed(1)}k
        - Volume Increase: ${tokenContext.volumeIncrease}%
        - Top Holder %: ${tokenContext.topHolderPercent}%
        
        SECURITY:
        - Mint Authority: ${tokenContext.mintAuthority ? '⚠️ Present (Risk)' : '✅ Revoked'}
        - Freeze Authority: ${tokenContext.freezeAuthority ? '⚠️ Present (Risk)' : '✅ Revoked'}
        - LP Burned: ${tokenContext.lpBurned ? '✅ Yes' : '⚠️ No'}
        
        LINKS:
        - DexScreener: https://dexscreener.com/solana/${tokenContext.mint}
        
        INSTRUCTIONS:
        - Answer the user's question specifically about this token.
        - Be concise, professional, but "degen-friendly" (use crypto terminology appropriately).
        - If the user asks about safety, refer to the Security section.
        - If the user asks clearly "should I buy", give a balanced analysis highlighting risks (High Volatility) vs potential, never financial advice.
        - ALWAYS provide the DexScreener link when relevant to checking the chart.
        - Keep responses under 3-4 sentences if possible for chat readability.
        `;

        const chat = model.startChat({
            history: [
                {
                    role: 'user',
                    parts: [{ text: systemContext }]
                },
                {
                    role: 'model',
                    parts: [{ text: `Understood. I am ready to analyze ${tokenContext.name} ($${tokenContext.symbol}).` }]
                }
            ],
            generationConfig: {
                maxOutputTokens: 1000,
            },
        });

        // Retry logic for rate limits (429)
        const maxRetries = 2; // Reduced retries to avoid long timeouts
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const result = await chat.sendMessage(lastUserMessage);
                const response = await result.response;
                const text = response.text();
                return NextResponse.json({ message: text });
            } catch (err: any) {
                const status = err?.status || err?.response?.status;
                const errorMessage = err?.message || "";

                // Check for Quota Exceeded (specifically daily limit)
                const isQuotaExceeded = errorMessage.includes('quota') || errorMessage.includes('Quota exceeded');
                const is429 = status === 429 || errorMessage.includes('429') || errorMessage.includes('Too Many Requests');

                if (isQuotaExceeded) {
                    console.error('[Chat API] Daily quota exhausted');
                    return NextResponse.json({
                        message: 'Daily AI analysis limit reached (Free Tier). Please try again tomorrow or upgrade your plan.'
                    }, { status: 429 });
                }

                if (is429 && attempt < maxRetries - 1) {
                    const retryMatch = errorMessage.match(/retry\s+in\s+([\d.]+)s/i);
                    // Cap wait time to 10s to avoid server timeouts
                    const waitSec = Math.min(retryMatch ? parseFloat(retryMatch[1]) + 1 : Math.pow(2, attempt + 1) * 2, 10);

                    console.warn(`[Chat API] Rate limited (attempt ${attempt + 1}/${maxRetries}). Retrying in ${waitSec.toFixed(1)}s...`);
                    await new Promise(resolve => setTimeout(resolve, waitSec * 1000));
                    continue;
                }

                // If it's a 429 but we're out of retries
                if (is429) {
                    return NextResponse.json({
                        message: 'The AI is currently busy handling many requests. Please wait a moment and try again.'
                    }, { status: 429 });
                }

                throw err;
            }
        }

        return NextResponse.json({ message: 'AI service temporarily unavailable. Please try again later.' }, { status: 503 });
    } catch (error: any) {
        console.error('Chat API Error:', error);
        const status = error?.status === 429 ? 429 : 500;
        const message = status === 429
            ? 'Rate limit exceeded. Please try again in a moment.'
            : 'Neural network interference detected. Please try again.';
        return NextResponse.json({ message }, { status });
    }
}
