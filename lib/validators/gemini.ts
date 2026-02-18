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

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log(`[Gemini Response - ${mode}]:`, text.substring(0, 100) + '...');

        // Clean up JSON response in case AI adds markdown blocks or extra text
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

    } catch (error) {
        console.error(`Gemini AI analysis error (${mode} mode):`, error);
        return null;
    }
}
