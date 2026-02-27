// lib/validators/grok.ts
import { TokenData } from '@/types';
import { AIAnalysis } from './gemini';

/**
 * Analyze token using xAI's Grok API as a fallback for Gemini
 */
export async function analyzeTokenWithGrok(
    token: TokenData,
    mode: 'conservative' | 'balanced' | 'aggressive' = 'balanced'
): Promise<AIAnalysis | null> {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_XAI_API_KEY') {
        console.warn('[Grok Warning]: XAI_API_KEY not configured - fallback unavailable');
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

        console.log(`[Grok API] Analyzing token: ${token.symbol}...`);
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'grok-beta', // More standard generic model name
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
            console.error(`[Grok API Error]: ${response.status} ${response.statusText}`, errText);
            return null;
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) {
            console.error('[Grok API] Empty response content');
            return null;
        }

        console.log('[Grok API] Token analysis successful');
        return JSON.parse(content) as AIAnalysis;

    } catch (error) {
        console.error('[Grok Fallback Error]:', error);
        return null;
    }
}

/**
 * Simple Grok chat completion for the AI Chat interface fallback
 */
export async function chatWithGrok(messages: any[], systemContext: string): Promise<string | null> {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_XAI_API_KEY') return null;

    try {
        console.log('[Grok API] Initiating chat request...');
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'grok-beta', // More standard generic model name
                messages: [
                    { role: 'system', content: systemContext },
                    ...messages
                ],
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`[Grok API Error]: ${response.status} ${response.statusText}`, errText);
            return null;
        }

        const data = await response.json();
        const responseText = data.choices[0]?.message?.content || null;
        console.log('[Grok API] Request successful');
        return responseText;

    } catch (error) {
        console.error('[Grok Chat Error]:', error);
        return null;
    }
}
