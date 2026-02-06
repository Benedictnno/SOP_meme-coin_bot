import { MongoClient, Db } from 'mongodb';
import dns from 'dns'
dns.setDefaultResultOrder('ipv4first')

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getMongoClient(): Promise<MongoClient> {
    if (!process.env.MONGODB_URI) {
        throw new Error('Please add your MONGODB_URI to .env.local');
    }

    let uri = process.env.MONGODB_URI.trim();

    // Remove surrounding quotes if they exist (common issue in some environments)
    if (uri.startsWith('"') && uri.endsWith('"')) {
        uri = uri.substring(1, uri.length - 1);
    } else if (uri.startsWith("'") && uri.endsWith("'")) {
        uri = uri.substring(1, uri.length - 1);
    }

    const options = {};


    if (process.env.NODE_ENV === 'development') {
        // In development mode, use a global variable so that the value
        // is preserved across module reloads caused by HMR (Hot Module Replacement).
        if (!global._mongoClientPromise) {
            client = new MongoClient(uri, options);
            global._mongoClientPromise = client.connect();
        }
        return global._mongoClientPromise;
    } else {
        // In production mode, it's best to not use a global variable.
        if (!clientPromise) {
            client = new MongoClient(uri, options);
            clientPromise = client.connect();
        }
        return clientPromise;
    }
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default getMongoClient;

// Helper function to get the database
export async function getDatabase(): Promise<Db> {
    const client = await getMongoClient();
    const dbName = process.env.MONGODB_DB_NAME;
    return client.db(dbName); // Uses dbName if provided, otherwise uses the default from URI
}

