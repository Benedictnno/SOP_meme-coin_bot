// lib/validators/gemini.ts
// Gemini AI integration for narrative and sentiment analysis

import { GoogleGenerativeAI } from '@google/generative-ai';
import { TokenData } from '@/types';
import { analyzeTokenWithGroq } from './groq_fallback';

/**
 * Initialize Gemini AI
 */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

export interface AIAnalysis {
    narrativeScore: number;
    hypeScore: number;
    sentiment: 'bullish' | 'neutral' | 'bearish';
    summary: string;
    risks: string[];
    potential: string;
    intelligenceBrief?: string[];
    narrativeAnalysis?: string;
    mode?: string;
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

      SCORING RUBRIC (EXTREMELY IMPORTANT):
      1. Originality (1-33 pts): Is this a unique idea or a lazy derivative of $DOGE/$PEPE/$WIF?
      2. Memeability (1-33 pts): How likely is this to go viral? Is the name catchy?
      3. Timing & Metadata (1-34 pts): Does it fit current meta? Are the socials professional?

      INSTRUCTIONS FOR GRANULARITY:
      - DO NOT use rounded numbers (e.g., Avoid 50, 60, 70, 80).
      - PROVIDE PRECISE SCORES based on the rubric (e.g., 67, 82, 43).
      - A score of 80 should only be given if the token is truly exceptional, not as a default.

      Return ONLY a JSON object with this exact structure:
      {
        "narrativeScore": number (1-100, be precise like 67 or 82),
        "hypeScore": number (1-100, be precise),
        "sentiment": "bullish" | "neutral" | "bearish",
        "summary": "2-sentence summary of the project",
        "risks": ["risk 1", "risk 2"],
        "potential": "low" | "medium" | "high" | "moonshot",
        "intelligenceBrief": ["3 key bullets for an elite trader"],
        "narrativeAnalysis": "Brief qualitative breakdown of the 'why' behind the narrative score"
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
                const isQuotaExceeded = err?.message?.includes('quota') || err?.message?.includes('Quota exceeded');
                const is429 = err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('Too Many Requests');

                if (isQuotaExceeded) {
                    console.error(`[Gemini] Quota exhausted for ${token.symbol}. Triggering Groq fallback...`);
                    return await analyzeTokenWithGroq(token, mode);
                }

                if (is429 && attempt < maxRetries - 1) {
                    // Parse retry delay from error message, or use exponential backoff
                    const retryMatch = err?.message?.match(/retry\s+in\s+([\d.]+)s/i);
                    let waitSec = retryMatch ? parseFloat(retryMatch[1]) + 1 : Math.pow(2, attempt + 1) * 5;

                    // If wait is too long, try Grok immediately
                    if (waitSec > 5) {
                        console.warn(`[Gemini] Rate limit delay too long (${waitSec.toFixed(1)}s). Triggering Groq fallback...`);
                        return await analyzeTokenWithGroq(token, mode);
                    }

                    console.warn(`[Gemini] Rate limited (attempt ${attempt + 1}/${maxRetries}). Retrying in ${waitSec.toFixed(1)}s...`);
                    await new Promise(resolve => setTimeout(resolve, waitSec * 1000));
                    continue;
                }

                if (is429) {
                    console.warn(`[Gemini] All retries exhausted for ${token.symbol}. Triggering Groq fallback...`);
                    return await analyzeTokenWithGroq(token, mode);
                }
                throw err;
            }
        }

        console.error(`[Gemini] All ${maxRetries} attempts failed for ${token.symbol}`);

        // --- FALLBACK TO GROQ ---
        if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'YOUR_GROQ_API_KEY') {
            console.log(`[EXECUTION]: Gemini failed. Triggering Groq emergency fallback for ${token.symbol}...`);
            return await analyzeTokenWithGroq(token, mode);
        }

        return null;

    } catch (error) {
        console.error(`Gemini AI analysis error (${mode} mode):`, error);
        return null;
    }
}
