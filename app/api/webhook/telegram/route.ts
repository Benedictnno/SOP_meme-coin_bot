import { NextRequest, NextResponse } from 'next/server';
import { searchTokens, getTokenDetails } from '@/lib/validators/dexscreener';
import { createEnhancedAlert } from '@/lib/validation-utils';
import { formatAlertMessage } from '@/lib/telegram';
import { getUserByTelegramChatId, hasActiveSubscription } from '@/lib/users';
import { BotSettings } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * POST /api/webhook/telegram
 * Webhook handler for Telegram bot updates
 */
export async function POST(request: NextRequest) {
    try {
        const secretToken = request.headers.get('x-telegram-bot-api-secret-token');
        if (process.env.TELEGRAM_SECRET && secretToken !== process.env.TELEGRAM_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await request.json();
        const message = payload.message || payload.edited_message;

        if (!message || !message.text) {
            return NextResponse.json({ ok: true });
        }

        const chatId = message.chat.id.toString();
        const text = message.text;

        // Handle Commands
        if (text.startsWith('/search')) {
            await handleSearchCommand(chatId, text);
        } else if (text.startsWith('/track')) {
            await handleTrackCommand(chatId, text);
        } else if (text.startsWith('/untrack')) {
            await handleUntrackCommand(chatId, text);
        } else if (text === '/wallets') {
            await handleWalletsCommand(chatId);
        } else if (text === '/start') {
            await sendMessage(chatId, "Welcome to the <b>SOP Meme Coin Alert Bot!</b> 🛡️\n\nI provide professional-grade security validation for Solana tokens.\n\n<b>Commands:</b>\n/search &lt;name|address&gt; - Validate a token\n/track &lt;address&gt; [label] - Start tracking a wallet\n/untrack &lt;address&gt; - Stop tracking a wallet\n/wallets - List tracked wallets\n/dashboard - Get link to your web dashboard\n/help - Show all commands");
        } else if (text === '/help') {
            await sendMessage(chatId, "<b>Available Commands:</b>\n\n/search &lt;query&gt; - Search and run 7-point SOP validation on a token\n/track &lt;address&gt; [label] - Get alerts when this wallet buys/sells\n/untrack &lt;address&gt; - Remove a wallet from tracking\n/wallets - List your tracked wallets\n/dashboard - Link to your personal dashboard\n/status - Check your subscription status");
        } else if (text === '/dashboard') {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sop-bot.vercel.app';
            await sendMessage(chatId, `🚀 <b>Your Dashboard:</b> <a href="${appUrl}/dashboard">Open Dashboard</a>`);
        } else if (text === '/status') {
            await handleStatusCommand(chatId);
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Telegram Webhook Error:', error);
        // Always return 200 to Telegram to avoid retries on failure
        return NextResponse.json({ ok: true });
    }
}

/**
 * Handle /status command
 */
async function handleStatusCommand(chatId: string) {
    const user = await getUserByTelegramChatId(chatId);
    if (!user) {
        await sendMessage(chatId, "⚠️ Account not linked.");
        return;
    }

    const isSubscribed = await hasActiveSubscription(user);
    const status = isSubscribed ? "✅ <b>Active</b>" : "❌ <b>Expired</b>";
    const expiry = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt).toLocaleDateString() : "Free Trial Period";

    await sendMessage(chatId, `📊 <b>Subscription Status:</b> ${status}\n📅 <b>Expiry/Renewal:</b> ${expiry}`);
}

/**
 * Handle /track <address> [label] command
 */
async function handleTrackCommand(chatId: string, text: string) {
    const parts = text.split(' ');
    const address = parts[1];
    const label = parts.slice(2).join(' ') || 'Unnamed Wallet';

    if (!address || address.length < 32) {
        await sendMessage(chatId, "⚠️ <b>Invalid Address</b>\nPlease provide a valid Solana wallet address: <code>/track &lt;address&gt; [label]</code>");
        return;
    }

    const user = await getUserByTelegramChatId(chatId);
    if (!user) {
        await sendMessage(chatId, "⚠️ Account not linked.");
        return;
    }

    const { getDatabase } = await import('@/lib/mongodb');
    const db = await getDatabase();

    const existing = await db.collection('tracked_wallets').findOne({ userId: user._id?.toString(), address });
    if (existing) {
        await sendMessage(chatId, "ℹ️ <b>Already tracking</b> this wallet.");
        return;
    }

    await db.collection('tracked_wallets').insertOne({
        userId: user._id?.toString(),
        address,
        label,
        createdAt: new Date().toISOString()
    });

    await sendMessage(chatId, `✅ <b>Wallet Tracked!</b>\n\n<b>Label:</b> ${label}\n<b>Address:</b> <code>${address}</code>\n\nYou will now receive alerts when this wallet makes a swap.`);
}

/**
 * Handle /untrack <address> command
 */
async function handleUntrackCommand(chatId: string, text: string) {
    const address = text.split(' ')[1];

    if (!address) {
        await sendMessage(chatId, "⚠️ <b>Missing Address</b>\nPlease provide the address to untrack: <code>/untrack &lt;address&gt;</code>");
        return;
    }

    const user = await getUserByTelegramChatId(chatId);
    if (!user) {
        await sendMessage(chatId, "⚠️ Account not linked.");
        return;
    }

    const { getDatabase } = await import('@/lib/mongodb');
    const db = await getDatabase();

    const result = await db.collection('tracked_wallets').deleteOne({ userId: user._id?.toString(), address });

    if (result.deletedCount === 0) {
        await sendMessage(chatId, "❌ <b>Wallet not found</b> in your tracking list.");
    } else {
        await sendMessage(chatId, `✅ <b>Wallet Untracked</b>\nStopped monitoring <code>${address}</code>`);
    }
}

/**
 * Handle /wallets command
 */
async function handleWalletsCommand(chatId: string) {
    const user = await getUserByTelegramChatId(chatId);
    if (!user) {
        await sendMessage(chatId, "⚠️ Account not linked.");
        return;
    }

    const { getDatabase } = await import('@/lib/mongodb');
    const db = await getDatabase();

    const wallets = await db.collection('tracked_wallets').find({ userId: user._id?.toString() }).toArray();

    if (wallets.length === 0) {
        await sendMessage(chatId, "📝 <b>You are not tracking any wallets yet.</b>\nUse <code>/track &lt;address&gt;</code> to start.");
        return;
    }

    const list = wallets.map((w, i) => `${i + 1}. <b>${w.label}</b>\n<code>${w.address}</code>`).join('\n\n');
    await sendMessage(chatId, `📋 <b>Your Tracked Wallets:</b>\n\n${list}\n\nUse <code>/untrack &lt;address&gt;</code> to remove.`);
}


/**
 * Handle /search <query> command
 */
async function handleSearchCommand(chatId: string, text: string) {
    const query = text.replace('/search', '').trim();

    if (!query) {
        await sendMessage(chatId, "⚠️ <b>Please provide a token name, symbol or address:</b>\nExample: <code>/search PEPE</code> or <code>/search 8wob...</code>", true);
        return;
    }

    // Find user to check subscription and get settings
    const user = await getUserByTelegramChatId(chatId);

    if (!user) {
        await sendMessage(chatId, "⚠️ <b>Account Not Linked</b>\n\nPlease sign in to the web dashboard and link your Telegram account in the settings to use this feature.");
        return;
    }

    const isSubscribed = await hasActiveSubscription(user);
    if (!isSubscribed) {
        await sendMessage(chatId, "⛔ <b>Subscription Expired</b>\n\nYour free trial has ended. Please visit the dashboard to subscribe and continue using the search feature.");
        return;
    }

    await sendMessage(chatId, `🔍 <b>Searching and validating:</b> <code>${query}</code>...\n<i>This may take up to 10 seconds.</i>`);

    try {
        // Default or user-specific settings
        const settings: BotSettings = user.settings || {
            minLiquidity: 20000,
            maxTopHolderPercent: 10,
            minVolumeIncrease: 100,
            scanInterval: 300,
            enableTelegramAlerts: true,
            aiMode: 'balanced'
        };

        // Discovery Logic
        let discoveredTokens = [];
        if (query.length >= 32 && !query.includes(' ')) {
            const directToken = await getTokenDetails(query);
            if (directToken) discoveredTokens.push(directToken);
        }

        const searchResults = await searchTokens(query);
        const allTokens = [...discoveredTokens];
        for (const result of searchResults) {
            if (!allTokens.some(t => t.mint === result.mint)) {
                allTokens.push(result);
            }
        }

        if (allTokens.length === 0) {
            await sendMessage(chatId, `❌ <b>No tokens found</b> for "${query}". Try a specific contract address.`);
            return;
        }

        // Process top result
        const token = allTokens[0];
        const alert = await createEnhancedAlert(token, settings);
        const formattedMessage = formatAlertMessage(alert);

        await sendMessage(chatId, formattedMessage);

        // If there were multiple results, mention it
        if (allTokens.length > 1) {
            await sendMessage(chatId, `<i>Found ${allTokens.length} matches. Showing the most relevant result.</i>`, true);
        }

    } catch (error) {
        console.error('Search command error:', error);
        await sendMessage(chatId, "❌ <b>Error:</b> An issues occurred while validating the token. Please try again later.");
    }
}



/**
 * Helper to send Telegram message
 */
async function sendMessage(chatId: string, text: string, silent: boolean = false) {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: 'HTML',
                disable_web_page_preview: true,
                disable_notification: silent
            })
        });
    } catch (err) {
        console.error('Failed to send Telegram message:', err);
    }
}
