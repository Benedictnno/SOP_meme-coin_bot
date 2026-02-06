const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local to avoid dotenv dependency issues if not installed/configured
try {
    const envPath = path.join(process.cwd(), '.env.local');
    console.log('Reading env from:', envPath);
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim();
                if (key && !key.startsWith('#')) {
                    process.env[key] = value;
                }
            }
        });
    }
} catch (e) {
    console.log('Error reading .env.local:', e.message);
}

const uri = process.env.MONGODB_URI;
console.log('Testing connection to:', uri ? 'URI Found' : 'URI Missing');

if (!uri) {
    console.error('No MONGODB_URI found in .env.local');
    process.exit(1);
}

const client = new MongoClient(uri);

async function run() {
    try {
        console.log('Connecting...');
        await client.connect();
        console.log('✅ Successfully connected to MongoDB!');
        const db = client.db('sop_scanner');
        const count = await db.collection('waitlist').countDocuments();
        console.log(`Current waitlist count: ${count}`);
    } catch (err) {
        console.error('❌ Connection failed:', err);
    } finally {
        await client.close();
    }
}

run();
