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
    freeTrialStartedAt?: Date | string;
    subscriptionExpiresAt?: Date | string;
    createdAt: Date | string;
    onboardingCompleted?: boolean;
    signupIp?: string;
    trialDenied?: boolean;
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

export async function createUser(email: string, passwordHash: string, signupIp?: string, trialDenied?: boolean) {
    const db = await getDatabase();
    const newUser: User = {
        email,
        password: passwordHash,
        role: 'user',
        createdAt: new Date(),
        onboardingCompleted: false,
        signupIp: signupIp || undefined,
        trialDenied: trialDenied || false,
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

export async function updateUserSubscription(userId: string, expiresAt: Date) {
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
    // Admin bypass: Admins always have an active subscription
    if (user.role === 'admin') {
        return true;
    }

    const now = new Date();

    // 1. Check paid subscription
    if (user.subscriptionExpiresAt) {
        const expiry = user.subscriptionExpiresAt instanceof Date 
            ? user.subscriptionExpiresAt 
            : new Date(user.subscriptionExpiresAt);
        if (expiry > now) return true;
    }

    // 2. Check 21-day Free Trial (from createdAt)
    const createdAtTime = user.createdAt instanceof Date 
        ? user.createdAt 
        : new Date(user.createdAt);
    const trialExpiry = new Date(createdAtTime.getTime() + 21 * 24 * 60 * 60 * 1000);

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

export async function getAllActiveUsers(): Promise<User[]> {
    const db = await getDatabase();
    const now = new Date();
    const trialPeriodMs = 21 * 24 * 60 * 60 * 1000;
    const trialCutoffDate = new Date(now.getTime() - trialPeriodMs);

    return await db.collection<User>('users').find({
        $or: [
            // Admin role is always active
            { role: 'admin' },
            // Active paid subscription (handle both Date and legacy string types in DB if necessary, but Date object is preferred)
            { subscriptionExpiresAt: { $gt: now } },
            // Active free trial (less than 21 days old)
            { createdAt: { $gt: trialCutoffDate } }
        ]
    }).toArray();
}
