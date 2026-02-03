import { config } from 'dotenv';
config({ path: '.env.local' });

import { getDatabase } from '../lib/mongodb';

async function migrateWaitlistData() {
    try {
        // Read existing JSON data
        const fs = require('fs');
        const path = require('path');
        const jsonPath = path.join(process.cwd(), 'waitlist.json');

        if (!fs.existsSync(jsonPath)) {
            console.log('No waitlist.json file found. Skipping migration.');
            return;
        }

        const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

        if (jsonData.length === 0) {
            console.log('Waitlist JSON is empty. Nothing to migrate.');
            return;
        }

        // Connect to MongoDB
        const db = await getDatabase();
        const waitlistCollection = db.collection('waitlist');

        // Check if data already exists
        const existingCount = await waitlistCollection.countDocuments();
        if (existingCount > 0) {
            console.log(`MongoDB already has ${existingCount} entries. Skipping migration to avoid duplicates.`);
            return;
        }

        // Convert timestamps to Date objects
        const documentsToInsert = jsonData.map((entry: any) => ({
            email: entry.email,
            timestamp: new Date(entry.timestamp),
            ip: entry.ip,
        }));

        // Insert into MongoDB
        const result = await waitlistCollection.insertMany(documentsToInsert);
        console.log(`✅ Successfully migrated ${result.insertedCount} waitlist entries to MongoDB`);

        // Optionally rename the JSON file as backup
        const backupPath = path.join(process.cwd(), 'waitlist.json.backup');
        fs.renameSync(jsonPath, backupPath);
        console.log(`📦 Backed up original JSON file to waitlist.json.backup`);

    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
}

// Run migration
migrateWaitlistData()
    .then(() => {
        console.log('Migration completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
