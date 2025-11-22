import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'memorymap';

if (!uri) {
  throw new Error('Missing MONGODB_URI environment variable');
}

let client;
let clientPromise;

export async function getDb(name = dbName) {
  if (!clientPromise) {
    client = new MongoClient(uri);
    clientPromise = client.connect();
  }
  const connectedClient = await clientPromise;
  return connectedClient.db(name);
}
