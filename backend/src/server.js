import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// IMPORTANT: Load environment variables FIRST before importing any other modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env and project root .env if present
const localEnvPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: localEnvPath });
const rootEnvPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath, override: false });
}

// Now import other modules after env vars are loaded
import cors from 'cors';
import express from 'express';
import { loginRouter } from './routes/login.js';
import { registerRouter } from './routes/register.js';
import { authRouter } from './routes/auth.js';
import { tasksRouter } from './routes/tasks.js';
import { memoriesRouter } from './routes/memories.js';
import { journalRouter } from './routes/journal.js';
import { moodRouter } from './routes/mood.js';
import { patientsRouter } from './routes/patients.js';
import { caregiversRouter } from './routes/caregivers.js';
import { uploadRouter } from './routes/upload.js';
import { contactsRouter } from './routes/contacts.js';

const app = express();
const allowedOrigins = process.env.CORS_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean);
const corsOptions = allowedOrigins?.length ? { origin: allowedOrigins } : undefined;

app.use(cors(corsOptions));
app.use(express.json());

// Serve uploaded files statically
const uploadsDir = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/login', loginRouter);
app.use('/api/register', registerRouter);
app.use('/api/auth', authRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/memories', memoriesRouter);
app.use('/api/journal', journalRouter);
app.use('/api/mood', moodRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/caregivers', caregiversRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/contacts', contactsRouter);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// API documentation endpoint
app.get('/api', (_req, res) => {
  res.json({
    message: 'Memory Map API',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/login': 'Login or register a user'
      },
      patients: {
        'GET /api/patients': 'Get all patients',
        'GET /api/patients/:id': 'Get patient by ID',
        'GET /api/patients/:id/dashboard': 'Get patient dashboard data',
        'PATCH /api/patients/:id': 'Update patient',
        'DELETE /api/patients/:id': 'Delete patient'
      },
      caregivers: {
        'GET /api/caregivers': 'Get all caregivers',
        'GET /api/caregivers/:id': 'Get caregiver by ID',
        'GET /api/caregivers/:id/patients': 'Get caregiver\'s patients',
        'GET /api/caregivers/:id/dashboard': 'Get caregiver dashboard data',
        'POST /api/caregivers': 'Create caregiver',
        'PATCH /api/caregivers/:id': 'Update caregiver',
        'DELETE /api/caregivers/:id': 'Delete caregiver'
      },
      tasks: {
        'GET /api/tasks': 'Get all tasks (filterable)',
        'GET /api/tasks/:id': 'Get task by ID',
        'POST /api/tasks': 'Create task',
        'PATCH /api/tasks/:id': 'Update task',
        'DELETE /api/tasks/:id': 'Delete task',
        'POST /api/tasks/:id/complete': 'Mark task as complete'
      },
      memories: {
        'GET /api/memories': 'Get all memories (filterable)',
        'GET /api/memories/:id': 'Get memory by ID',
        'POST /api/memories': 'Create memory',
        'PATCH /api/memories/:id': 'Update memory',
        'DELETE /api/memories/:id': 'Delete memory'
      },
      journal: {
        'GET /api/journal': 'Get all journal entries (filterable)',
        'GET /api/journal/:id': 'Get journal entry by ID',
        'GET /api/journal/:id/messages': 'Get chat history for a journal entry',
        'POST /api/journal': 'Create journal entry',
        'POST /api/journal/:id/chat': 'Generate AI response for a journal entry and persist conversation',
        'POST /api/journal/voice/transcribe': 'Transcribe an audio file to text',
        'PATCH /api/journal/:id': 'Update journal entry',
        'DELETE /api/journal/:id': 'Delete journal entry'
      },
      mood: {
        'GET /api/mood': 'Get all mood entries (filterable)',
        'GET /api/mood/:id': 'Get mood entry by ID',
        'GET /api/mood/patient/:patientId/today': 'Get today\'s mood for patient',
        'GET /api/mood/patient/:patientId/stats': 'Get mood statistics',
        'POST /api/mood': 'Create mood entry',
        'PATCH /api/mood/:id': 'Update mood entry',
        'DELETE /api/mood/:id': 'Delete mood entry'
      },
      contacts: {
        'GET /api/contacts': 'Get all contacts (filterable)',
        'GET /api/contacts/:id': 'Get contact by ID',
        'GET /api/contacts/patient/:patientId': 'Get all contacts for a patient',
        'POST /api/contacts': 'Create contact',
        'PATCH /api/contacts/:id': 'Update contact',
        'DELETE /api/contacts/:id': 'Delete contact'
      },
      upload: {
        'POST /api/upload': 'Upload single file',
        'POST /api/upload/multiple': 'Upload multiple files'
      }
    }
  });
});

const port = Number(process.env.PORT) || 4000;

// Initialize database indexes on startup (but don't block the server from starting)
import { initializeIndexes } from './models/index.js';
initializeIndexes().catch(err => {
  console.error('Failed to initialize database indexes:', err);
});

app.listen(port, () => {
  console.log(`API server running on port ${port}`);
  console.log(`API documentation available at http://localhost:${port}/api`);
});
