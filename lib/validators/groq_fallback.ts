// lib/validators/groq_fallback.ts
import { TokenData } from '@/types';
import { AIAnalysis } from './gemini';

/**
 * Analyze token using Groq (GroqCloud) as a free fallback for Gemini
 * Uses Llama-3.3-70b-versatile (Free Tier)
 */
export async function analyzeTokenWithGroq(
    token: TokenData,
    mode: 'conservative' | 'balanced' | 'aggressive' = 'balanced'
): Promise<AIAnalysis | null> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GROQ_API_KEY') {
        console.warn('[Groq Warning]: GROQ_API_KEY not configured - fallback unavailable');
        return null;
    }

    const modeInstructions = {
        conservative: "Focus heavily on safety and skepticism. Professional analysis.",
        balanced: "Balance technical safety with narrative hype.",
        aggressive: "Focus primarily on viral potential and memeability."
    };

    try {
        const prompt = `
      As an expert Solana meme coin analyst operating in ${mode.toUpperCase()} mode, analyze this token.
      
      INSTRUCTIONS: ${modeInstructions[mode]}
      Token: ${token.name} ($${token.symbol})
      Narrative: ${token.narrative}
      MC: $${token.marketCap.toLocaleString()}
      Liq: $${token.liquidity.toLocaleString()}
      Volume Spike: ${token.volumeIncrease}%

      SCORING RUBRIC:
      1. Originality (1-33 pts)
      2. Memeability (1-33 pts)
      3. Timing & Metadata (1-34 pts)

      REQUIREMENT: DO NOT use rounded numbers (Avoid 60, 70, 80). PROVIDE PRECISE SCORES (e.g., 67, 82).

      Return ONLY a JSON object:
      {
        "narrativeScore": number (1-100),
        "hypeScore": number (1-100),
        "sentiment": "bullish" | "neutral" | "bearish",
        "summary": "2-sentence summary",
        "risks": ["risk 1", "risk 2"],
        "potential": "low" | "medium" | "high" | "moonshot",
        "intelligenceBrief": ["3 key bullets"],
        "narrativeAnalysis": "Qualitative breakdown"
      }
    `;

        console.log(`[Groq API] Analyzing token: ${token.symbol}...`);
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: 'You are a professional crypto analyst JSON bot.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`[Groq API Error]: ${response.status} ${response.statusText}`, errText);
            return null;
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) {
            console.error('[Groq API] Empty response content');
            return null;
        }

        console.log('[Groq API] Token analysis successful');
        return JSON.parse(content) as AIAnalysis;

    } catch (error) {
        console.error('[Groq Fallback Error]:', error);
        return null;
    }
}

/**
 * Simple Groq chat completion for the AI Chat interface fallback
 */
export async function chatWithGroq(messages: any[], systemContext: string): Promise<string | null> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GROQ_API_KEY') return null;

    try {
        console.log('[Groq API] Initiating chat request...');
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemContext },
                    ...messages
                ],
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`[Groq API Error]: ${response.status} ${response.statusText}`, errText);
            return null;
        }

        const data = await response.json();
        const responseText = data.choices[0]?.message?.content || null;
        console.log('[Groq API] Request successful');
        return responseText;

    } catch (error) {
        console.error('[Groq Chat Error]:', error);
        return null;
    }
}
