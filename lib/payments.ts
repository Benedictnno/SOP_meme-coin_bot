import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getDatabase } from './mongodb';
import { ObjectId } from 'mongodb';
import { User } from './users';

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const RECIPIENT_WALLET = process.env.PAYMENT_RECIPIENT_ADDRESS || '';
const SUBSCRIPTION_PRICE_SOL = parseFloat(process.env.SUBSCRIPTION_PRICE_SOL || '0.1');

export async function verifySolanaTransaction(signature: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
        if (!RECIPIENT_WALLET) {
            return { success: false, message: 'Server configuration error: Recipient wallet missing' };
        }

        const connection = new Connection(RPC_URL, 'confirmed');
        const tx = await connection.getTransaction(signature, {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0,
        });

        if (!tx) {
            return { success: false, message: 'Transaction not found. Please wait a few seconds and try again.' };
        }

        // 1. Verify recipient
        const accountKeys = tx.transaction.message.getAccountKeys();
        const instructions = tx.transaction.message.compiledInstructions;

        let foundRecipient = false;
        let amountPaid = 0;

        // Simple check for System Program transfer in a Basic Transaction
        // For more complex (versioned) or program-based transfers, this might need enhancement
        tx.meta?.postBalances.forEach((balance, index) => {
            const pubkey = accountKeys.get(index)?.toBase58();
            if (pubkey === RECIPIENT_WALLET) {
                foundRecipient = true;
                const preBalance = tx.meta?.preBalances[index] || 0;
                amountPaid = (balance - preBalance) / LAMPORTS_PER_SOL;
            }
        });

        if (!foundRecipient) {
            return { success: false, message: 'Recipient address does not match admin wallet.' };
        }

        // 2. Verify Amount
        if (amountPaid < SUBSCRIPTION_PRICE_SOL * 0.98) { // Allow for small discrepancies
            return { success: false, message: `Insufficient payment. Expected ${SUBSCRIPTION_PRICE_SOL} SOL, found ${amountPaid.toFixed(4)} SOL.` };
        }

        // 3. Mark transaction as used to prevent replay attacks
        const db = await getDatabase();
        const existingTx = await db.collection('payments').findOne({ signature });
        if (existingTx) {
            return { success: false, message: 'This transaction has already been used for a subscription.' };
        }

        // 4. Update User Subscription (Add 30 days)
        const user = await db.collection<User>('users').findOne({ _id: new ObjectId(userId) });
        if (!user) return { success: false, message: 'User not found.' };

        const currentExpiry = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : new Date();
        const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
        const newExpiry = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

        await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $set: { subscriptionExpiresAt: newExpiry } }
        );

        // 5. Record Payment
        await db.collection('payments').insertOne({
            userId: new ObjectId(userId),
            signature,
            amount: amountPaid,
            timestamp: new Date().toISOString(),
            expiryWas: user.subscriptionExpiresAt,
            newExpiry
        });

        return { success: true, message: `Successfully upgraded! New expiry: ${new Date(newExpiry).toLocaleDateString()}` };

    } catch (error) {
        console.error('Payment verification error:', error);
        return { success: false, message: 'Verification failed. Check signature or network status.' };
    }
}
