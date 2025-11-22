import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loginRouter } from './routes/login.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env and project root .env if present
const localEnvPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: localEnvPath });
const rootEnvPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath, override: false });
}

const app = express();
const allowedOrigins = process.env.CORS_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean);
const corsOptions = allowedOrigins?.length ? { origin: allowedOrigins } : undefined;

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/login', loginRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const port = Number(process.env.PORT) || 4000;

app.listen(port, () => {
  console.log(`API server running on port ${port}`);
});
