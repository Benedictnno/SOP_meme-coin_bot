const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local
const envConfig = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '../.env.local')));
for (const k in envConfig) {
    process.env[k] = envConfig[k];
}

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log("Checking models with API Key ending in:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.slice(-4) : "NONE");

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        // There isn't a direct listModels on the client instance in the node SDK easily accessibly in all versions, 
        // but usually it's on the class or manager. 
        // Actually, strictly speaking, the SDK doesn't always expose listModels directly in the high-level helper 
        // without using the model manager. 
        // Let's try to just run a simple generateContent on a few likely candidates to see which one works.

        const candidates = [
            "gemini-2.0-flash",
            "gemini-2.0-flash-exp",
            "gemini-1.5-flash",
            "gemini-1.5-flash-001",
            "gemini-1.5-pro",
            "gemini-pro"
        ];

        console.log("\nTesting generation with candidates:");

        for (const modelName of candidates) {
            process.stdout.write(`Testing ${modelName}... `);
            try {
                const m = genAI.getGenerativeModel({ model: modelName });
                const result = await m.generateContent("Hello");
                const response = await result.response;
                console.log("✅ SUCCESS");
            } catch (e) {
                console.log("❌ FAILED: " + e.message.split('\n')[0]);
            }
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
