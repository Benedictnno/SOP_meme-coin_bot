import { getDatabase } from './mongodb';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

export interface User {
    _id?: ObjectId;
    email: string;
    password?: string;
    solanaAddress?: string;
    telegramChatId?: string;
    role: 'user' | 'admin';
    freeTrialStartedAt?: string;
    subscriptionExpiresAt?: string;
    createdAt: string;
    settings?: {
        minLiquidity: number;
        maxTopHolderPercent: number;
        minVolumeIncrease: number;
        scanInterval: number;
        enableTelegramAlerts: boolean;
        minCompositeScore: number;
        minSocialScore: number;
        whaleOnly: boolean;
        aiMode: 'conservative' | 'balanced' | 'aggressive';
    };
}

export async function getUserByEmail(email: string) {
    const db = await getDatabase();
    return await db.collection<User>('users').findOne({ email });
}

export async function createUser(email: string, passwordHash: string) {
    const db = await getDatabase();
    const newUser: User = {
        email,
        password: passwordHash,
        role: 'user',
        createdAt: new Date().toISOString(),
        settings: {
            minLiquidity: 50000,
            maxTopHolderPercent: 10,
            minVolumeIncrease: 200,
            scanInterval: 60,
            enableTelegramAlerts: false,
            minCompositeScore: 50,
            minSocialScore: 30,
            whaleOnly: false,
            aiMode: 'balanced'
        }
    };
    const result = await db.collection('users').insertOne(newUser);
    return { ...newUser, _id: result.insertedId };
}

export async function updateUserSubscription(userId: string, expiresAt: string) {
    const db = await getDatabase();
    await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { subscriptionExpiresAt: expiresAt } }
    );
}

export async function updateUserTelegram(userId: string, chatId: string) {
    const db = await getDatabase();
    await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { telegramChatId: chatId } }
    );
}

export async function hasActiveSubscription(user: User): Promise<boolean> {
    const now = new Date();

    // 1. Check paid subscription
    if (user.subscriptionExpiresAt) {
        const expiry = new Date(user.subscriptionExpiresAt);
        if (expiry > now) return true;
    }

    // 2. Check 21-day Free Trial (from createdAt)
    const createdAt = new Date(user.createdAt);
    const trialExpiry = new Date(createdAt.getTime() + 21 * 24 * 60 * 60 * 1000);

    if (trialExpiry > now) {
        return true;
    }

    return false;
}

export async function getUserById(id: string) {
    if (!id) return null;
    try {
        const db = await getDatabase();
        return await db.collection<User>('users').findOne({ _id: new ObjectId(id) });
    } catch {
        return null;
    }
}

export async function getUserByTelegramChatId(chatId: string) {
    const db = await getDatabase();
    return await db.collection<User>('users').findOne({ telegramChatId: chatId });
}

