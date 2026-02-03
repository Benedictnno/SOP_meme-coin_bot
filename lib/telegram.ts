// lib/telegram.ts
// Telegram bot integration for alert notifications

import { Alert } from '@/types';

/**
 * Send alert notification to Telegram
 * @param alert - Alert object with token and validation data
 * @returns Boolean indicating success
 */
export async function sendTelegramAlert(alert: Alert): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  if (!botToken || !chatId) {
    console.log('Telegram not configured - skipping alert');
    return false;
  }
  
  try {
    const message = formatAlertMessage(alert);
    
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
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        })
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Telegram API error:', error);
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
function formatAlertMessage(alert: Alert): string {
  const { token, checks, passedChecks, totalChecks, setupType, rugCheckScore } = alert;
  
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
  
  const message = `
🚨 *VALID MEME COIN SETUP DETECTED*

*Token:* ${token.symbol} (${token.name})
*Setup Type:* ${setupType}
*Validation Score:* ${passedChecks}/${totalChecks} ${passedChecks === totalChecks ? '✅' : '⚠️'}

*📊 Key Metrics*
💰 Liquidity: $${(token.liquidity / 1000).toFixed(1)}k
📈 Volume Δ: +${token.volumeIncrease.toFixed(0)}%
👥 Top Holder: ${token.topHolderPercent.toFixed(1)}%
💵 Price: $${token.priceUSD}
📊 Market Cap: $${(token.marketCap / 1000).toFixed(1)}k

*🔍 Validation Checks*
${checkEmojis.narrative} Narrative
${checkEmojis.attention} Fresh Attention
${checkEmojis.liquidity} Clean Liquidity
${checkEmojis.volume} Organic Volume
${checkEmojis.contract} Contract Verified
${checkEmojis.holders} Holder Distribution
${checkEmojis.sellTest} Sell Test Passed

*🛡️ Safety Score*
RugCheck: ${rugCheckScore}/100

*📝 Narrative*
${token.narrative}

*🔗 Links*
[Trade on Jupiter](https://jup.ag/swap/SOL-${token.mint})
[DEX Screener](https://dexscreener.com/solana/${token.pairAddress || token.mint})

*📋 Contract*
\`${token.mint}\`

⚠️ *Always validate manually before trading*
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
    const message = `
🤖 *Solana Meme Alert Bot*

Test message - your Telegram integration is working!

The bot is configured and ready to send alerts.
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
          parse_mode: 'Markdown'
        })
      }
    );
    
    return response.ok;
    
  } catch (error) {
    console.error('Test message failed:', error);
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
    const message = `
📊 *Daily Alert Summary*

Found ${validAlerts.length} valid setup(s) today:

${validAlerts.map((alert, i) => 
  `${i + 1}. *${alert.token.symbol}* - ${alert.setupType}
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
          parse_mode: 'Markdown'
        })
      }
    );
    
    return response.ok;
    
  } catch (error) {
    console.error('Batch summary failed:', error);
    return false;
  }
}