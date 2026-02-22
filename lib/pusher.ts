import Pusher from 'pusher';

// Initialize Pusher for server-side events
// You will need to add these to your .env.local
export const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID || '',
    key: process.env.PUSHER_KEY || '',
    secret: process.env.PUSHER_SECRET || '',
    cluster: process.env.PUSHER_CLUSTER || 'mt1',
    useTLS: true,
});

/**
 * Trigger a real-time update to the dashboard feed
 */
export async function pushSniperAlert(alert: any) {
    try {
        if (!process.env.PUSHER_APP_ID) {
            console.warn('[Pusher] Skipping push: Missing API keys');
            return;
        }

        await pusher.trigger('sniper-feed', 'new-alert', {
            alert,
        });
        console.log(`[Pusher] Alert pushed: ${alert.token.symbol}`);
    } catch (error) {
        console.error('[Pusher] Push failed:', error);
    }
}
