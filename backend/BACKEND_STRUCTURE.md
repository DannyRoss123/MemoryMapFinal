# Backend Structure

## Directory Layout

```
backend/
├── src/
│   ├── models/
│   │   └── schemas.js              # MongoDB schema definitions and constants
│   ├── routes/
│   │   ├── login.js                # Authentication routes
│   │   ├── patients.js             # Patient management routes
│   │   ├── caregivers.js           # Caregiver management routes
│   │   ├── tasks.js                # Task management routes
│   │   ├── memories.js             # Memory (images/videos) routes
│   │   ├── journal.js              # Journal entry routes
│   │   ├── mood.js                 # Mood tracking routes
│   │   └── upload.js               # File upload routes
│   ├── services/
│   │   └── db.js                   # Database connection and helpers
│   ├── middleware/
│   │   └── upload.js               # Multer file upload middleware
│   └── server.js                   # Express server setup
├── uploads/                        # Uploaded files (gitignored)
├── package.json
├── API_DOCUMENTATION.md            # Complete API documentation
├── BACKEND_STRUCTURE.md            # This file
└── README.md                       # Setup instructions

## Key Features

### 1. MongoDB Collections

- **users** - Both patients and caregivers with role-based data
- **caregivers** - Extended caregiver information
- **tasks** - Daily tasks assigned by caregivers to patients
- **memories** - Images and videos uploaded by caregivers
- **journalEntries** - Patient journal entries
- **moodEntries** - Daily mood tracking for patients

### 2. API Routes

#### Authentication
- `POST /api/login` - Login or register users

#### Patient Management
- `GET /api/patients` - List all patients
- `GET /api/patients/:id` - Get patient details
- `GET /api/patients/:id/dashboard` - Patient dashboard with all related data
- `PATCH /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

#### Caregiver Management
- `GET /api/caregivers` - List all caregivers
- `GET /api/caregivers/:id` - Get caregiver details
- `GET /api/caregivers/:id/patients` - Get caregiver's patients
- `GET /api/caregivers/:id/dashboard` - Caregiver dashboard
- `POST /api/caregivers` - Create caregiver
- `PATCH /api/caregivers/:id` - Update caregiver
- `DELETE /api/caregivers/:id` - Delete caregiver

#### Task Management
- `GET /api/tasks` - List tasks (filterable)
- `GET /api/tasks/:id` - Get task details
- `POST /api/tasks` - Create task
- `PATCH /api/tasks/:id` - Update task
- `POST /api/tasks/:id/complete` - Mark task complete
- `DELETE /api/tasks/:id` - Delete task

#### Memory Management
- `GET /api/memories` - List memories (filterable)
- `GET /api/memories/:id` - Get memory details
- `POST /api/memories` - Create memory record
- `PATCH /api/memories/:id` - Update memory metadata
- `DELETE /api/memories/:id` - Delete memory

#### Journal Entries
- `GET /api/journal` - List journal entries (filterable)
- `GET /api/journal/:id` - Get journal entry
- `POST /api/journal` - Create journal entry
- `PATCH /api/journal/:id` - Update journal entry
- `DELETE /api/journal/:id` - Delete journal entry

#### Mood Tracking
- `GET /api/mood` - List mood entries (filterable)
- `GET /api/mood/:id` - Get mood entry
- `GET /api/mood/patient/:patientId/today` - Get today's mood
- `GET /api/mood/patient/:patientId/stats` - Get mood statistics
- `POST /api/mood` - Create mood entry
- `PATCH /api/mood/:id` - Update mood entry
- `DELETE /api/mood/:id` - Delete mood entry

#### File Upload
- `POST /api/upload` - Upload single file
- `POST /api/upload/multiple` - Upload multiple files
- `GET /uploads/:filename` - Serve uploaded files

### 3. Database Indexes

Automatically created indexes for performance:
- Users: role, caregiverId, name
- Caregivers: name (unique)
- Tasks: patientId + dueDate, caregiverId, completed + dueDate
- Memories: patientId + createdAt, caregiverId, type
- Journal Entries: patientId + date, createdAt
- Mood Entries: patientId + date (unique)

### 4. File Upload System

- **Middleware**: Multer with custom storage configuration
- **Storage**: Local filesystem in `backend/uploads/`
- **Supported formats**:
  - Images: JPEG, PNG, GIF, WebP
  - Videos: MP4, MPEG, MOV, WebM
- **Size limit**: 100MB per file
- **Naming**: `{originalname}-{timestamp}-{random}.{ext}`

### 5. Data Relationships

```
Caregiver (1) ──┐
                ├──> Patient (N) ──┐
                │                   ├──> Tasks (N)
                │                   ├──> Memories (N)
                │                   ├──> Journal Entries (N)
                │                   └──> Mood Entries (N, 1 per day)
                │
                └──> Tasks (N, created by caregiver)
                └──> Memories (N, uploaded by caregiver)
```

### 6. Special Features

#### Dashboard Endpoints
Both patients and caregivers have dedicated dashboard endpoints that aggregate all relevant data:
- Patient dashboard: tasks, memories, journal, mood, statistics
- Caregiver dashboard: all patients, tasks, memories, today's moods

#### Mood Tracking
- One entry per patient per day (enforced by unique index)
- Automatic mood score calculation (1-5)
- Statistics endpoint for mood analysis

#### File Management
- Files are stored locally with unique names
- URLs returned for frontend consumption
- Static file serving for uploaded content

## Environment Variables

Required in `.env` file at project root:

```bash
# MongoDB
MONGODB_URI=mongodb+srv://...
MONGODB_DB=memorymap

# Server
PORT=4000

# CORS (optional, comma-separated)
CORS_ORIGINS=http://localhost:3000
```

## Running the Backend

1. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env` file in the project root (see `.env.example`)

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Start production server**:
   ```bash
   npm start
   ```

5. **Access API documentation**:
   Visit `http://localhost:4000/api` in your browser

## Data Flow Examples

### 1. Patient Daily Workflow
```
1. Login (POST /api/login)
2. Get dashboard (GET /api/patients/:id/dashboard)
3. View tasks (included in dashboard)
4. Complete task (POST /api/tasks/:id/complete)
5. Record mood (POST /api/mood)
6. Write journal entry (POST /api/journal)
7. View memories (included in dashboard)
```

### 2. Caregiver Daily Workflow
```
1. Login (POST /api/login)
2. Get dashboard (GET /api/caregivers/:id/dashboard)
3. View all patients and their moods
4. Upload memory file (POST /api/upload)
5. Create memory record (POST /api/memories)
6. Assign new task (POST /api/tasks)
7. Check patient progress (GET /api/patients/:id/dashboard)
```

## Error Handling

All routes include proper error handling:
- Input validation
- MongoDB error handling
- File upload error handling
- Appropriate HTTP status codes
- Descriptive error messages

## Security Considerations

Current implementation:
- CORS configuration
- Input validation
- File type validation
- File size limits

To add (recommendations):
- Authentication middleware (JWT)
- Rate limiting
- Input sanitization
- SQL injection protection (using MongoDB properly handles this)
- File upload virus scanning

## Testing the API

You can test the API using:
- **Postman** or **Insomnia** for manual testing
- **curl** for command-line testing
- **Frontend integration** with the Next.js app

Example curl request:
```bash
# Health check
curl http://localhost:4000/health

# Login
curl -X POST http://localhost:4000/api/login \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","role":"PATIENT","location":"New York"}'

# Upload file
curl -X POST http://localhost:4000/api/upload \
  -F "file=@/path/to/image.jpg"
```

## Next Steps

To extend this backend:
1. Add authentication (JWT tokens)
2. Add authorization middleware
3. Add real-time features (Socket.io)
4. Add notifications
5. Add data export functionality
6. Add backup/restore functionality
7. Add analytics endpoints
8. Add email notifications
9. Add search functionality
10. Add pagination for large datasets
