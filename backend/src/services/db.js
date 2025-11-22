import '../config/env.js'; // Load environment variables first
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'memorymap';

let client;
let clientPromise;

export async function getDb(name = dbName) {
  if (!clientPromise) {
    client = new MongoClient(uri);
    clientPromise = client.connect();
  }
  const connectedClient = await clientPromise;
  const db = connectedClient.db(name);
  return db;
}

// Helper function to get a specific collection
export async function getCollection(collectionName) {
  const db = await getDb();
  return db.collection(collectionName);
}

// Collection names
export const Collections = {
  USERS: 'users',
  CAREGIVERS: 'caregivers',
  TASKS: 'tasks',
  MEMORIES: 'memories',
  JOURNAL_ENTRIES: 'journalEntries',
  MOOD_ENTRIES: 'moodEntries'
};
