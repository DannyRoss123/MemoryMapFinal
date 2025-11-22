import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env and project root .env if present
const localEnvPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: localEnvPath });

const rootEnvPath = path.resolve(__dirname, '../../../.env');
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath, override: false });
}

// Verify required environment variables
if (!process.env.MONGODB_URI) {
  console.error('ERROR: MONGODB_URI environment variable is not set');
  console.error('Please create a .env file in the MemoryMapFinal directory with MONGODB_URI');
  process.exit(1);
}

export default {
  MONGODB_URI: process.env.MONGODB_URI,
  MONGODB_DB: process.env.MONGODB_DB || 'memorymap',
  PORT: Number(process.env.PORT) || 4000,
  CORS_ORIGINS: process.env.CORS_ORIGINS
};
