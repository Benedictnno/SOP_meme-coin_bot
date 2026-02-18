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

        const result = await chat.sendMessage(lastUserMessage);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ message: text });
    } catch (error) {
        console.error('Chat API Error:', error);
        return NextResponse.json({ message: 'Neural network interference detected. Please try again.' }, { status: 500 });
    }
}
