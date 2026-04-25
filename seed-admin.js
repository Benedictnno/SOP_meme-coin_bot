const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seed() {
    const uri = process.env.MONGODB_URI;
    const email = process.env.ADMIN_EMAIL || 'Benedictnnaoma0@gmail.com';
    const password = process.env.ADMIN_PASSWORD || 'Chigozie0';
    
    if (!uri) {
        console.error("MONGODB_URI is missing");
        process.exit(1);
    }
    
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db();
        const usersCol = db.collection('users');
        
        const passwordHash = await bcrypt.hash(password, 10);
        
        const existing = await usersCol.findOne({ email });
        
        if (existing) {
            await usersCol.updateOne({ email }, {
                $set: {
                    role: 'admin',
                    password: passwordHash
                }
            });
            console.log("Admin user updated successfully.");
        } else {
            await usersCol.insertOne({
                email,
                password: passwordHash,
                role: 'admin',
                createdAt: new Date(),
                onboardingCompleted: true,
                settings: {
                    minLiquidity: 50000,
                    maxTopHolderPercent: 10,
                    minVolumeIncrease: 200,
                    scanInterval: 60,
                    enableTelegramAlerts: true,
                    minCompositeScore: 50,
                    minSocialScore: 30,
                    whaleOnly: false,
                    aiMode: 'balanced'
                }
            });
            console.log("Admin user created successfully.");
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

seed();
