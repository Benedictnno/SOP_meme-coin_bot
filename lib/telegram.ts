// lib/telegram.ts
// Telegram bot integration for alert notifications

import { Alert, EnhancedAlert } from '@/types';

/**
 * Send alert notification to Telegram
 * @param alert - Alert object with token and validation data
 * @param overrideChatId - Optional alternative chatId to send to
 * @returns Boolean indicating success
 */
export async function sendTelegramAlert(alert: EnhancedAlert, overrideChatId?: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const configChatId = process.env.TELEGRAM_CHAT_ID;
  const chatId = overrideChatId || configChatId;

  if (!botToken || !chatId) {
    console.log('Telegram not configured - skipping alert');
    return false;
  }

  try {
    const message = formatAlertMessage(alert);
    console.log(`Sending Telegram alert to ${chatId}...`);

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`Telegram API error (${response.status}):`, error);
      return false;
    }

    console.log(`Telegram alert sent for ${alert.token.symbol}`);
    return true;

  } catch (error) {
    console.error('Failed to send Telegram alert:', error);
    return false;
  }
}

/**
 * Format alert data into Telegram message
 * @param alert - Alert object
 * @returns Formatted message string
 */
export function formatAlertMessage(alert: EnhancedAlert): string {
  const { token, checks, passedChecks, totalChecks, setupType, rugCheckScore, compositeScore, aiAnalysis, risks } = alert;

  // Build check status indicators
  const checkEmojis = {
    narrative: checks.narrative ? '✅' : '❌',
    attention: checks.attention ? '✅' : '❌',
    liquidity: checks.liquidity ? '✅' : '❌',
    volume: checks.volume ? '✅' : '❌',
    contract: checks.contract ? '✅' : '❌',
    holders: checks.holders ? '✅' : '❌',
    sellTest: checks.sellTest ? '✅' : '❌'
  };

  const escapeHTML = (text: string | null | undefined) => {
    if (!text) return '';
    return text.toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };

  const safeSymbol = escapeHTML(token.symbol);
  const safeName = escapeHTML(token.name);
  const safeAiSummary = aiAnalysis ? escapeHTML(aiAnalysis.summary) : '';

  const message = `
🚨 <b>SOLANA BOT: NEW HIGH-POTENTIAL COIN</b> 🚨

<b>Token:</b> ${safeSymbol} (${safeName})
<b>Strategy:</b> ${setupType === 'Base Break' ? 'Heavy Buy Pressure' : 'Healthy Dip Entry'}
<b>Confidence:</b> ${passedChecks}/${totalChecks} ${passedChecks === totalChecks ? '💎 DIAMOND' : '⚠️ WATCH'}

<b>📊 Volume Breakdown (Trading Activity)</b>
🕐 Last 1 Hour: $${(token.volume1h ? token.volume1h / 1000 : 0).toFixed(1)}k
📅 Last 24 Hours: $${(token.volume24h ? token.volume24h / 1000 : 0).toFixed(1)}k
📈 Growth Spike: ${token.volumeIncrease.toFixed(0)}%
💰 Safe Liquidity: $${(token.liquidity / 1000).toFixed(1)}k

<b>🔍 Health Check (Simple Explanations)</b>
${checkEmojis.narrative} <b>Social Trend:</b> Good story &amp; social presence?
${checkEmojis.attention} <b>Hype Spike:</b> Sudden surge in interest?
${checkEmojis.liquidity} <b>Cash Depth:</b> Enough money for easy trading?
${checkEmojis.volume} <b>Real Volume:</b> Genuine trading activity?
${checkEmojis.contract} <b>Safe Code:</b> Clean from scam functions?
${checkEmojis.holders} <b>Fair Shares:</b> Top holders own too much? (${token.topHolderPercent.toFixed(1)}%)
${checkEmojis.sellTest} <b>Selling:</b> Can we exit profit easily?

<b>🛡️ Scoreboard</b>
🛡️ <b>Security Score:</b> ${rugCheckScore}/100 (High = Safer)
🎯 <b>Final Alpha Score:</b> ${compositeScore}/100 (AI Rating)

${alert.whaleActivity.involved ? `<b>🐋 WHALE ACTIVITY:</b>
• Tracked Smart Wallets are accumulating!
` : ''}
${risks && risks.length > 0 ? `<b>⚠️ Red Flags:</b>
${risks.map(r => `• ${escapeHTML(r)}`).join('\n')}
` : ''}
${aiAnalysis ? `🤖 <b>AI NARRATIVE AGENT</b>
<i>${safeAiSummary}</i>

<b>Market Sentiment:</b> ${escapeHTML(aiAnalysis.sentiment.toUpperCase())}
<b>Potential:</b> ${escapeHTML(aiAnalysis.potential.toUpperCase())}
` : `🤖 <b>AI AGENT:</b> No recent narrative metadata for deep analysis.`}

<b>🔗 Trade &amp; View</b>
<a href="https://jup.ag/swap/SOL-${token.mint}">Buy on Jupiter</a>
<a href="https://dexscreener.com/solana/${token.pairAddress || token.mint}">DexScreener Chart</a>

<b>📋 Contract</b>
<code>${token.mint}</code>

⚠️ <b>Warning: Memecoins are high risk. Trade responsibly.</b>
  `.trim();

  return message;
}

/**
 * Send test message to verify Telegram configuration
 * @returns Boolean indicating success
 */
export async function sendTestMessage(): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error('Telegram credentials not configured');
    return false;
  }

  try {
    console.log(`Sending Telegram test message to ${chatId} using token ${botToken.substring(0, 10)}...`);
    const message = `
🤖 <b>Solana Meme Alert Bot</b>

Test message - your Telegram integration is working!

The bot is configured and ready to send alerts.
    `.trim();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML'
          }),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Telegram Test API error (${response.status}):`, errorText);
        return false;
      }

      console.log('Telegram test message sent successfully');
      return true;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('Telegram API request timed out after 10 seconds');
      } else {
        console.error('Telegram fetch network error:', fetchError.message);
      }
      return false;
    }
  } catch (error) {
    console.error('Overall test message process failed:', error);
    return false;
  }
}

/**
 * Send batch summary (useful for daily digests)
 * @param alerts - Array of alerts to summarize
 * @returns Boolean indicating success
 */
export async function sendBatchSummary(alerts: Alert[]): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return false;
  }

  const validAlerts = alerts.filter(a => a.isValid);

  if (validAlerts.length === 0) {
    return false;
  }

  try {
    const escapeHTML = (text: string | null | undefined) => {
      if (!text) return '';
      return text.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    };

    const message = `
📊 <b>Daily Alert Summary</b>

Found ${validAlerts.length} valid setup(s) today:

${validAlerts.map((alert, i) =>
      `${i + 1}. <b>${escapeHTML(alert.token.symbol)}</b> - ${alert.setupType}
   💰 $${(alert.token.liquidity / 1000).toFixed(1)}k liquidity
   📈 +${alert.token.volumeIncrease.toFixed(0)}% volume`
    ).join('\n\n')}

Check the dashboard for full details.
    `.trim();

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML'
        })
      }
    );

    return response.ok;

  } catch (error) {
    console.error('Batch summary failed:', error);
    return false;
  }
}

/**
 * Send alert for wallet activity
 * @param activity - Wallet activity data
 * @param label - Wallet label
 * @param walletAddress - Wallet address
 * @param alert - Enhanced alert object (if token was validated)
 * @param chatId - Target Telegram chat ID
 */
export async function sendWalletActivityAlert(
  activity: any,
  label: string,
  walletAddress: string,
  alert: EnhancedAlert | null,
  chatId: string
): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken || !chatId) return false;

  const typeEmoji = activity.type === 'buy' ? '🟢 BUY' : '🔴 SELL';
  const confidenceEmoji = alert?.compositeScore && alert.compositeScore >= 70 ? '💎' : '⚠️';
  const escapeHTML = (text: string | null | undefined) => {
    if (!text) return '';
    return text.toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };

  let message = `
🔔 <b>WALLET TRACKER: ${typeEmoji}</b>

<b>Wallet:</b> ${escapeHTML(label)}
<code>${walletAddress}</code>

<b>Token:</b> ${escapeHTML(activity.tokenSymbol)}
<b>Amount:</b> ${activity.tokenAmount.toFixed(2)} (${activity.solAmount.toFixed(2)} SOL)

${alert ? `<b>SOP Security Validation:</b>
🛡️ Alpha Score: ${alert.compositeScore}/100 ${confidenceEmoji}
✅ Checks: ${alert.passedChecks}/${alert.totalChecks}
⚠️ Risks: ${alert.risks.length > 0 ? escapeHTML(alert.risks[0]) : 'None'}

<a href="https://jup.ag/swap/SOL-${activity.tokenMint}">Buy on Jupiter</a>
` : `<i>Token security validation not available</i>`}

<a href="https://solscan.io/tx/${activity.signature}">View Transaction</a>
  `.trim();

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        })
      }
    );
    return response.ok;
  } catch (error) {
    console.error('Wallet activity alert failed:', error);
    return false;
  }
}

/**
 * Send a censored teaser alert to an expired user's Telegram
 * Hides token details to entice upgrade — capped at 1 per 6h per user
 */
export async function sendTeaserAlert(
  alert: EnhancedAlert,
  chatId: string,
  userId: string
): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sop-memescanner.com';

  if (!botToken || !chatId) return false;

  try {
    // Rate-limit: 1 teaser per 6 hours per user
    const { getDatabase } = await import('@/lib/mongodb');
    const db = await getDatabase();
    const recentTeaser = await db.collection('sent_alerts').findOne({
      userId,
      type: 'teaser',
      timestamp: { $gt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() }
    });
    if (recentTeaser) return false;

    const scoreLabel = alert.compositeScore >= 85 ? '85-100 🟢 EXCEPTIONAL'
      : alert.compositeScore >= 70 ? '70-84 🟡 HIGH'
        : '50-69 🟠 MODERATE';

    const message = `
🚨 <b>SOP MEMESCANNER — SIGNAL DETECTED</b> 🚨

⚠️ <b>Your free trial has ended.</b>
The engine just caught a high-opportunity token — and you're missing it.

<b>📊 Signal Overview</b>
🎯 Alpha Score: <b>${scoreLabel}</b>
🔍 Checks Passed: <b>${alert.passedChecks}/${alert.totalChecks}</b>
💰 Liquidity: <b>$${(alert.token.liquidity / 1000).toFixed(0)}k+</b>
📈 Volume Spike: <b>${alert.token.volumeIncrease.toFixed(0)}%+</b>

🔒 <b>Token name, mint, buy links &amp; AI analysis are locked.</b>

👉 <a href="${appUrl}/subscribe">Unlock Full Access → Subscribe Now</a>

<i>Upgrade with SOL to resume all alerts immediately.</i>
    `.trim();

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        })
      }
    );

    if (response.ok) {
      await db.collection('sent_alerts').insertOne({
        userId,
        type: 'teaser',
        timestamp: new Date().toISOString()
      });
      console.log(`[Teaser] Sent expired-user teaser to chatId ${chatId}`);
    }

    return response.ok;
  } catch (error) {
    console.error('Failed to send teaser alert:', error);
    return false;
  }
}
