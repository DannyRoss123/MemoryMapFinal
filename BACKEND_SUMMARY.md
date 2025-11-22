# Memory Map Backend - Implementation Summary

## Overview

A complete backend API for a memory care application built with Express.js and MongoDB. The application supports patients with memory care needs and their caregivers.

## ✅ What Has Been Created

### 1. MongoDB Schema Definitions
**File**: `backend/src/models/schemas.js`

Defined schemas for:
- **Users** - Patients and caregivers
- **Caregivers** - Extended caregiver information
- **Tasks** - Daily tasks for patients
- **Memories** - Images and videos
- **Journal Entries** - Patient journals
- **Mood Entries** - Daily mood tracking

### 2. Database Service
**File**: `backend/src/services/db.js`

- MongoDB connection management
- Automatic index creation for performance
- Collection helper functions
- Database connection pooling

### 3. API Routes

#### Authentication
**File**: `backend/src/routes/login.js`
- User login/registration

#### Patient Management
**File**: `backend/src/routes/patients.js`
- List all patients
- Get patient details
- Get patient dashboard (aggregated data)
- Update patient information
- Delete patient

#### Caregiver Management
**File**: `backend/src/routes/caregivers.js`
- List all caregivers
- Get caregiver details
- Get caregiver's patients
- Get caregiver dashboard (aggregated data)
- Create new caregiver
- Update caregiver information
- Delete caregiver

#### Task Management
**File**: `backend/src/routes/tasks.js`
- List tasks (with filters)
- Get task details
- Create new task
- Update task
- Mark task as complete
- Delete task

#### Memory Management
**File**: `backend/src/routes/memories.js`
- List memories (with filters)
- Get memory details
- Create memory record
- Update memory metadata
- Delete memory

#### Journal Management
**File**: `backend/src/routes/journal.js`
- List journal entries (with filters)
- Get journal entry details
- Create journal entry
- Update journal entry
- Delete journal entry

#### Mood Tracking
**File**: `backend/src/routes/mood.js`
- List mood entries (with filters)
- Get mood entry details
- Get today's mood for a patient
- Get mood statistics for a patient
- Create mood entry (one per day)
- Update mood entry
- Delete mood entry

#### File Upload
**File**: `backend/src/routes/upload.js`
- Upload single file (image/video)
- Upload multiple files
- File validation and error handling

### 4. Middleware
**File**: `backend/src/middleware/upload.js`

- Multer configuration for file uploads
- File type validation (images and videos)
- File size limits (100MB)
- Unique filename generation
- Upload directory management

### 5. Server Configuration
**File**: `backend/src/server.js`

- Express server setup
- CORS configuration
- Route mounting
- Static file serving for uploads
- API documentation endpoint
- Health check endpoint

### 6. Documentation
- **API_DOCUMENTATION.md** - Complete API reference with examples
- **BACKEND_STRUCTURE.md** - Backend architecture and structure
- **README.md** - Setup instructions

## 📊 Database Structure

### Collections and Relationships

```
caregivers (Collection)
    ├── _id (unique)
    ├── name (unique)
    ├── location
    ├── profileImage
    └── timestamps

users (Collection)
    ├── _id (unique)
    ├── name
    ├── role (PATIENT | CAREGIVER)
    ├── location
    ├── caregiverId → references caregivers._id
    ├── caregiverName
    ├── profileImage
    └── timestamps

tasks (Collection)
    ├── _id (unique)
    ├── patientId → references users._id
    ├── caregiverId → references caregivers._id
    ├── title
    ├── description
    ├── dueDate
    ├── completed
    ├── completedAt
    ├── priority (LOW | MEDIUM | HIGH)
    └── timestamps

memories (Collection)
    ├── _id (unique)
    ├── patientId → references users._id
    ├── caregiverId → references caregivers._id
    ├── type (IMAGE | VIDEO)
    ├── url
    ├── title
    ├── description
    ├── caption
    ├── fileSize
    ├── mimeType
    └── timestamps

journalEntries (Collection)
    ├── _id (unique)
    ├── patientId → references users._id
    ├── content
    ├── title
    ├── date
    └── timestamps

moodEntries (Collection)
    ├── _id (unique)
    ├── patientId → references users._id
    ├── mood (VERY_SAD | SAD | NEUTRAL | HAPPY | VERY_HAPPY)
    ├── moodScore (1-5)
    ├── notes
    ├── date (unique per patient per day)
    └── createdAt
```

## 🔑 Key Features

### 1. Dashboard Endpoints
- **Patient Dashboard**: Aggregates tasks, memories, journal entries, and mood data
- **Caregiver Dashboard**: Shows all patients, tasks, memories, and today's moods

### 2. Mood Tracking
- One entry per patient per day (enforced by unique index)
- Automatic mood score calculation (1-5 scale)
- Statistics endpoint for mood analysis over time periods

### 3. File Upload System
- Support for images (JPEG, PNG, GIF, WebP)
- Support for videos (MP4, MPEG, MOV, WebM)
- 100MB file size limit
- Unique filename generation to prevent conflicts
- Static file serving

### 4. Advanced Filtering
All list endpoints support filtering:
- Tasks: by patient, caregiver, completion status, date range
- Memories: by patient, caregiver, type
- Journal: by patient, date range
- Mood: by patient, date range

### 5. Database Indexes
Automatically created for optimal performance:
- Users: role, caregiverId, name
- Caregivers: name (unique)
- Tasks: patientId + dueDate, caregiverId, completed + dueDate
- Memories: patientId + createdAt, caregiverId, type
- Journal Entries: patientId + date
- Mood Entries: patientId + date (unique)

## 📁 File Structure

```
backend/
├── src/
│   ├── models/
│   │   └── schemas.js              # Schema definitions
│   ├── routes/
│   │   ├── login.js                # Auth routes
│   │   ├── patients.js             # Patient routes
│   │   ├── caregivers.js           # Caregiver routes
│   │   ├── tasks.js                # Task routes
│   │   ├── memories.js             # Memory routes
│   │   ├── journal.js              # Journal routes
│   │   ├── mood.js                 # Mood routes
│   │   └── upload.js               # Upload routes
│   ├── services/
│   │   └── db.js                   # Database service
│   ├── middleware/
│   │   └── upload.js               # Upload middleware
│   └── server.js                   # Server setup
├── uploads/                        # Uploaded files (gitignored)
├── node_modules/                   # Dependencies
├── package.json                    # Dependencies
├── API_DOCUMENTATION.md            # API reference
├── BACKEND_STRUCTURE.md            # Architecture docs
└── README.md                       # Setup guide
```

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
cd MemoryMapFinal/backend
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root (`MemoryMapFinal/.env`):

```env
# MongoDB connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=appname
MONGODB_DB=memorymap

# Server port
PORT=4000

# CORS (comma-separated origins)
CORS_ORIGINS=http://localhost:3000
```

### 3. Start the Server

**Development mode** (with NODE_ENV=development):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

### 4. Verify Installation
- Health check: `http://localhost:4000/health`
- API docs: `http://localhost:4000/api`

## 🔗 API Endpoints Summary

### Authentication
- `POST /api/login` - Login/register

### Patients
- `GET /api/patients` - List patients
- `GET /api/patients/:id` - Get patient
- `GET /api/patients/:id/dashboard` - Patient dashboard
- `PATCH /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Caregivers
- `GET /api/caregivers` - List caregivers
- `GET /api/caregivers/:id` - Get caregiver
- `GET /api/caregivers/:id/patients` - Get caregiver's patients
- `GET /api/caregivers/:id/dashboard` - Caregiver dashboard
- `POST /api/caregivers` - Create caregiver
- `PATCH /api/caregivers/:id` - Update caregiver
- `DELETE /api/caregivers/:id` - Delete caregiver

### Tasks
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `PATCH /api/tasks/:id` - Update task
- `POST /api/tasks/:id/complete` - Complete task
- `DELETE /api/tasks/:id` - Delete task

### Memories
- `GET /api/memories` - List memories
- `POST /api/memories` - Create memory
- `PATCH /api/memories/:id` - Update memory
- `DELETE /api/memories/:id` - Delete memory

### Journal
- `GET /api/journal` - List entries
- `POST /api/journal` - Create entry
- `PATCH /api/journal/:id` - Update entry
- `DELETE /api/journal/:id` - Delete entry

### Mood
- `GET /api/mood` - List mood entries
- `GET /api/mood/patient/:id/today` - Get today's mood
- `GET /api/mood/patient/:id/stats` - Get mood stats
- `POST /api/mood` - Create mood entry
- `PATCH /api/mood/:id` - Update mood entry
- `DELETE /api/mood/:id` - Delete mood entry

### Upload
- `POST /api/upload` - Upload single file
- `POST /api/upload/multiple` - Upload multiple files
- `GET /uploads/:filename` - Access uploaded files

## 📝 Usage Examples

### Example 1: Patient Login
```bash
curl -X POST http://localhost:4000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "role": "PATIENT",
    "location": "New York",
    "caregiverName": "Jane Smith"
  }'
```

### Example 2: Create Task
```bash
curl -X POST http://localhost:4000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "507f1f77bcf86cd799439011",
    "caregiverId": "507f1f77bcf86cd799439012",
    "title": "Take morning medication",
    "dueDate": "2024-01-20T09:00:00.000Z",
    "priority": "HIGH"
  }'
```

### Example 3: Upload and Create Memory
```bash
# 1. Upload file
curl -X POST http://localhost:4000/api/upload \
  -F "file=@family-photo.jpg"

# 2. Create memory record with returned URL
curl -X POST http://localhost:4000/api/memories \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "507f1f77bcf86cd799439011",
    "caregiverId": "507f1f77bcf86cd799439012",
    "type": "IMAGE",
    "url": "/uploads/family-photo-1642251600000-123456.jpg",
    "title": "Family Reunion"
  }'
```

## 🛡️ Security Considerations

### Current Implementation
- ✅ CORS configuration
- ✅ Input validation
- ✅ File type validation
- ✅ File size limits
- ✅ MongoDB injection protection (via ObjectId)

### Recommended Additions
- ⚠️ JWT authentication
- ⚠️ Rate limiting
- ⚠️ Request size limits
- ⚠️ Helmet.js security headers
- ⚠️ File upload virus scanning
- ⚠️ Input sanitization
- ⚠️ HTTPS enforcement

## 🧪 Testing

The backend is ready to be tested with:
- **Postman** or **Insomnia** for manual API testing
- **curl** for command-line testing
- **Frontend integration** with the Next.js app

## 📦 Dependencies

- **express** - Web framework
- **mongodb** - MongoDB driver
- **cors** - CORS middleware
- **dotenv** - Environment variables
- **multer** - File upload handling

## 🎯 Next Steps for Integration

1. **Configure .env file** with MongoDB credentials
2. **Start the backend server**
3. **Test endpoints** using Postman or curl
4. **Integrate with frontend** (update API_BASE_URL in frontend)
5. **Test file uploads** from frontend
6. **Add authentication** (optional but recommended)

## 💡 Tips

- All dates should be in ISO 8601 format
- ObjectId strings are 24 hex characters
- File uploads use multipart/form-data
- All endpoints return JSON
- Error responses include descriptive messages

## 📚 Additional Resources

- Full API documentation: `backend/API_DOCUMENTATION.md`
- Backend structure details: `backend/BACKEND_STRUCTURE.md`
- MongoDB documentation: https://docs.mongodb.com
- Express.js documentation: https://expressjs.com
