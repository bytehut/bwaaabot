import { MongoClient, Db, Collection, Document } from 'mongodb';

let client: MongoClient;
let database: Db;

export interface SpotifyToken extends Document {
    userId: string;
    accessToken: string;
    refreshToken: string;
    expiration: number;
}

export interface ListenAlongSession extends Document {
    serverId: string;
    roomId: string;
    host: SpotifyToken;
    listeners: SpotifyToken[];
    trackHistory: SpotifyApi.TrackObjectFull[];
    dateCreated: Date;
    dateEnded: Date | null;
}

export interface ListenAlongHistory extends Document {
    serverId: string;
    sessions: ListenAlongSession[];
}

export async function connectToDatabase(mongoUri: string, dbName: string): Promise<void> {
    try {
    
        client = new MongoClient(mongoUri);
        await client.connect();
        database = client.db(dbName);
    
        console.log('Connected to MongoDB successfully');
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        throw error;
    }
}

export async function closeDatabase(): Promise<void> {
    if (client) {
        await client.close();
        console.log('MongoDB connection closed');
    }
}

export function getDatabase(): Db {
    if (!database) {
        throw new Error('Database not initialized. Call connectToDatabase() first.');
    }
    return database;
}

export function getCollection<T extends Document = any>(collectionName: string): Collection<T> {
    return getDatabase().collection<T>(collectionName);
}