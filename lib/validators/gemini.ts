// lib/validators/gemini.ts
// Gemini AI integration for narrative and sentiment analysis

import { GoogleGenerativeAI } from '@google/generative-ai';
import { TokenData } from '@/types';

/**
 * Initialize Gemini AI
 */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

export interface AIAnalysis {
    narrativeScore: number;
    hypeScore: number;
    sentiment: 'bullish' | 'neutral' | 'bearish';
    summary: string;
    risks: string[];
    potential: string;
    mode?: string; // Analysis mode used
}

/**
 * Analyze token narrative and market sentiment using Gemini AI
 * @param token - Token data to analyze
 * @param mode - Personality mode for the AI (conservative, balanced, aggressive)
 * @returns AI summary and scores
 */
export async function analyzeTokenNarrative(
    token: TokenData,
    mode: 'conservative' | 'balanced' | 'aggressive' = 'balanced'
): Promise<AIAnalysis | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.warn('GEMINI_API_KEY not configured - skipping AI analysis');
        return null;
    }

    // Adjust personality based on mode
    const modeInstructions = {
        conservative: "Focus heavily on safety, long-term viability, and professionalism. Be extremely skeptical of hype and reject anything that looks like a short-term trend or derivative meme.",
        balanced: "Balance technical safety with narrative hype. Look for projects with both solid fundamentals and reasonable viral potential.",
        aggressive: "Focus primarily on viral potential, memeability, and 'meta-shifting' narratives. Be willing to overlook minor technical red flags if the narrative is extremely compelling and has moonshot potential."
    };

    try {
        const prompt = `
      As an expert Solana meme coin analyst operating in ${mode.toUpperCase()} mode, analyze the following token.
      
      PERSONALITY INSTRUCTIONS: ${modeInstructions[mode]}
      
      Token Name: ${token.name}
      Symbol: ${token.symbol}
      Narrative: ${token.narrative}
      Market Cap: $${token.marketCap.toLocaleString()}
      Liquidity: $${token.liquidity.toLocaleString()}
      Volume Increase: ${token.volumeIncrease}%
      Socials: ${JSON.stringify(token.socials)}

      Examine the "Narrative" for:
      1. Originality vs. derivative of existing memes.
      2. Viral potential (memeability).
      3. Timeliness (relevance to current market trends).
      4. Professionalism (does it look like a low-effort scam or a brand?).

      Return ONLY a JSON object with this exact structure:
      {
        "narrativeScore": number (1-100),
        "hypeScore": number (1-100),
        "sentiment": "bullish" | "neutral" | "bearish",
        "summary": "2-sentence summary of the project",
        "risks": ["risk 1", "risk 2"],
        "potential": "low" | "medium" | "high" | "moonshot"
      }
    `;

        // Retry logic for rate limits (429)
        const maxRetries = 3;
        let lastError: any = null;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                console.log(`[Gemini Response - ${mode}]:`, text.substring(0, 100) + '...');

                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (!jsonMatch) {
                    console.error(`[Gemini Error]: No JSON found in response for ${token.symbol}. Text:`, text);
                    return null;
                }

                const parsed = JSON.parse(jsonMatch[0]) as AIAnalysis;

                if (!parsed.summary || !parsed.potential) {
                    console.warn(`[Gemini Warning]: Parsed response missing required fields for ${token.symbol}`);
                }

                return parsed;

            } catch (err: any) {
                lastError = err;
                const is429 = err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('Too Many Requests');

                if (is429 && attempt < maxRetries - 1) {
                    // Parse retry delay from error message, or use exponential backoff
                    const retryMatch = err?.message?.match(/retry\s+in\s+([\d.]+)s/i);
                    const waitSec = retryMatch ? parseFloat(retryMatch[1]) + 1 : Math.pow(2, attempt + 1) * 5;
                    console.warn(`[Gemini] Rate limited (attempt ${attempt + 1}/${maxRetries}). Retrying in ${waitSec.toFixed(1)}s...`);
                    await new Promise(resolve => setTimeout(resolve, waitSec * 1000));
                    continue;
                }
                throw err;
            }
        }

        console.error(`[Gemini] All ${maxRetries} attempts failed for ${token.symbol}`);
        return null;

    } catch (error) {
        console.error(`Gemini AI analysis error (${mode} mode):`, error);
        return null;
    }
}
