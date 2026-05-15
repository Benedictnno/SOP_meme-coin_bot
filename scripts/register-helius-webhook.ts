import { config } from 'dotenv';
config({ path: '.env.local' });

/**
 * scripts/register-helius-webhook.ts
 * One-time setup script to register the Helius push webhook.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register scripts/register-helius-webhook.ts
 *
 * Required env vars in .env.local:
 *   HELIUS_API_KEY=your_helius_project_api_key
 *   NEXT_PUBLIC_APP_URL=https://yourdomain.com
 *   HELIUS_WEBHOOK_SECRET=your_random_secret_string
 *
 * After running, save the returned webhookID as HELIUS_WEBHOOK_ID in .env.local
 */
async function registerWebhook() {
    const apiKey    = process.env.HELIUS_API_KEY;
    const appUrl    = process.env.NEXT_PUBLIC_APP_URL;
    const secret    = process.env.HELIUS_WEBHOOK_SECRET;

    if (!apiKey || !appUrl || !secret) {
        console.error('❌ Missing required env vars: HELIUS_API_KEY, NEXT_PUBLIC_APP_URL, HELIUS_WEBHOOK_SECRET');
        process.exit(1);
    }

    const webhookUrl = `${appUrl}/api/webhooks/helius-discovery`;

    console.log(`Registering webhook at: ${webhookUrl}`);

    const response = await fetch(`https://api.helius.xyz/v0/webhooks?api-key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            webhookURL: webhookUrl,
            transactionTypes: ['TOKEN_MINT', 'SWAP'],
            accountAddresses: [], // empty = monitor all addresses
            webhookType: 'enhanced',
            authHeader: `Bearer ${secret}`
        })
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('❌ Failed to register webhook:', data);
        process.exit(1);
    }

    console.log('✅ Webhook registered successfully');
    console.log(`Webhook ID: ${data.webhookID}`);
    console.log('\nAdd this to your .env.local:');
    console.log(`HELIUS_WEBHOOK_ID=${data.webhookID}`);
}

registerWebhook().catch(console.error);
