# Memory Map Backend API Documentation

## Overview

This is the backend API for the Memory Map application - a memory care application for patients and caregivers. The API is built with Express.js and MongoDB.

## Base URL

```
http://localhost:4000
```

## MongoDB Collections

### 1. **users**
Stores both patients and caregivers
- `_id`: ObjectId
- `name`: String
- `role`: "PATIENT" | "CAREGIVER"
- `location`: String
- `caregiverId`: ObjectId (for patients)
- `caregiverName`: String (denormalized)
- `profileImage`: String (URL)
- `createdAt`: Date
- `updatedAt`: Date

### 2. **caregivers**
Extended caregiver information
- `_id`: ObjectId
- `name`: String (unique)
- `location`: String
- `profileImage`: String (URL)
- `patients`: Array<ObjectId>
- `createdAt`: Date
- `updatedAt`: Date

### 3. **tasks**
Daily tasks assigned to patients
- `_id`: ObjectId
- `patientId`: ObjectId
- `caregiverId`: ObjectId
- `title`: String
- `description`: String
- `dueDate`: Date
- `completed`: Boolean
- `completedAt`: Date
- `priority`: "LOW" | "MEDIUM" | "HIGH"
- `createdAt`: Date
- `updatedAt`: Date

### 4. **memories**
Images and videos for patients
- `_id`: ObjectId
- `patientId`: ObjectId
- `caregiverId`: ObjectId
- `type`: "IMAGE" | "VIDEO"
- `url`: String
- `title`: String
- `description`: String
- `caption`: String
- `fileSize`: Number
- `mimeType`: String
- `createdAt`: Date
- `updatedAt`: Date

### 5. **journalEntries**
Patient journal entries
- `_id`: ObjectId
- `patientId`: ObjectId
- `content`: String
- `title`: String
- `date`: Date
- `createdAt`: Date
- `updatedAt`: Date

### 6. **moodEntries**
Daily mood tracking (one per patient per day)
- `_id`: ObjectId
- `patientId`: ObjectId
- `mood`: "VERY_SAD" | "SAD" | "NEUTRAL" | "HAPPY" | "VERY_HAPPY"
- `moodScore`: Number (1-5)
- `notes`: String
- `date`: Date
- `createdAt`: Date

---

## API Endpoints

### Authentication

#### POST `/api/login`
Login or register a user

**Request Body:**
```json
{
  "name": "John Doe",
  "role": "PATIENT",  // or "CAREGIVER"
  "location": "New York",
  "caregiverName": "Jane Smith"  // optional, for patients
}
```

**Response:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "role": "PATIENT",
  "location": "New York",
  "caregiverId": "507f1f77bcf86cd799439012",
  "caregiverName": "Jane Smith"
}
```

---

### Patients

#### GET `/api/patients`
Get all patients (optionally filter by caregiver)

**Query Parameters:**
- `caregiverId` (optional): Filter by caregiver ID

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "role": "PATIENT",
    "location": "New York",
    "caregiverId": "507f1f77bcf86cd799439012",
    "caregiverName": "Jane Smith",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

#### GET `/api/patients/:id`
Get a specific patient by ID

#### GET `/api/patients/:id/dashboard`
Get comprehensive dashboard data for a patient

**Response:**
```json
{
  "patient": { /* patient object */ },
  "tasks": {
    "recent": [ /* 5 recent tasks */ ],
    "total": 25,
    "completed": 20,
    "pending": 5
  },
  "memories": {
    "recent": [ /* 10 recent memories */ ],
    "total": 50
  },
  "journal": {
    "recent": [ /* 5 recent entries */ ],
    "total": 30
  },
  "mood": {
    "recent": [ /* last 7 days */ ]
  }
}
```

#### PATCH `/api/patients/:id`
Update a patient

**Request Body:**
```json
{
  "name": "John Updated",
  "location": "Los Angeles",
  "caregiverId": "507f1f77bcf86cd799439012",
  "profileImage": "/uploads/profile.jpg"
}
```

#### DELETE `/api/patients/:id`
Delete a patient

---

### Caregivers

#### GET `/api/caregivers`
Get all caregivers

#### GET `/api/caregivers/:id`
Get a specific caregiver

#### GET `/api/caregivers/:id/patients`
Get all patients assigned to a caregiver

#### GET `/api/caregivers/:id/dashboard`
Get comprehensive dashboard data for a caregiver

**Response:**
```json
{
  "caregiver": { /* caregiver object */ },
  "patients": {
    "list": [ /* patient objects */ ],
    "total": 5
  },
  "tasks": {
    "recent": [ /* 10 recent tasks */ ],
    "total": 100,
    "completed": 80,
    "pending": 20
  },
  "memories": {
    "recent": [ /* 10 recent memories */ ],
    "total": 200
  },
  "todaysMoods": [ /* mood entries for today */ ]
}
```

#### POST `/api/caregivers`
Create a new caregiver

**Request Body:**
```json
{
  "name": "Jane Smith",
  "location": "New York",
  "profileImage": "/uploads/jane.jpg"
}
```

#### PATCH `/api/caregivers/:id`
Update a caregiver

#### DELETE `/api/caregivers/:id`
Delete a caregiver (only if no patients assigned)

---

### Tasks

#### GET `/api/tasks`
Get all tasks with optional filters

**Query Parameters:**
- `patientId`: Filter by patient
- `caregiverId`: Filter by caregiver
- `completed`: Filter by completion status (true/false)
- `startDate`: Filter by start date
- `endDate`: Filter by end date

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439013",
    "patientId": "507f1f77bcf86cd799439011",
    "caregiverId": "507f1f77bcf86cd799439012",
    "title": "Take morning medication",
    "description": "Take 2 pills with breakfast",
    "dueDate": "2024-01-20T09:00:00.000Z",
    "completed": false,
    "priority": "HIGH",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

#### GET `/api/tasks/:id`
Get a specific task

#### POST `/api/tasks`
Create a new task

**Request Body:**
```json
{
  "patientId": "507f1f77bcf86cd799439011",
  "caregiverId": "507f1f77bcf86cd799439012",
  "title": "Take morning medication",
  "description": "Take 2 pills with breakfast",
  "dueDate": "2024-01-20T09:00:00.000Z",
  "priority": "HIGH"  // LOW, MEDIUM, or HIGH
}
```

#### PATCH `/api/tasks/:id`
Update a task

**Request Body:**
```json
{
  "title": "Updated title",
  "completed": true,
  "priority": "MEDIUM"
}
```

#### POST `/api/tasks/:id/complete`
Mark a task as complete

#### DELETE `/api/tasks/:id`
Delete a task

---

### Memories

#### GET `/api/memories`
Get all memories with optional filters

**Query Parameters:**
- `patientId`: Filter by patient
- `caregiverId`: Filter by caregiver
- `type`: Filter by type (IMAGE or VIDEO)

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439014",
    "patientId": "507f1f77bcf86cd799439011",
    "caregiverId": "507f1f77bcf86cd799439012",
    "type": "IMAGE",
    "url": "/uploads/family-photo-123456.jpg",
    "title": "Family Reunion",
    "description": "Summer 2023 family gathering",
    "caption": "Great times with loved ones",
    "fileSize": 2048000,
    "mimeType": "image/jpeg",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

#### GET `/api/memories/:id`
Get a specific memory

#### POST `/api/memories`
Create a new memory (after uploading file)

**Request Body:**
```json
{
  "patientId": "507f1f77bcf86cd799439011",
  "caregiverId": "507f1f77bcf86cd799439012",
  "type": "IMAGE",
  "url": "/uploads/family-photo-123456.jpg",
  "title": "Family Reunion",
  "description": "Summer 2023 family gathering",
  "caption": "Great times with loved ones",
  "fileSize": 2048000,
  "mimeType": "image/jpeg"
}
```

#### PATCH `/api/memories/:id`
Update a memory (title, description, caption only)

#### DELETE `/api/memories/:id`
Delete a memory

---

### Journal Entries

#### GET `/api/journal`
Get all journal entries with optional filters

**Query Parameters:**
- `patientId`: Filter by patient
- `startDate`: Filter by start date
- `endDate`: Filter by end date

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439015",
    "patientId": "507f1f77bcf86cd799439011",
    "title": "A Great Day",
    "content": "Today was wonderful. I spent time with family...",
    "date": "2024-01-15T00:00:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

#### GET `/api/journal/:id`
Get a specific journal entry

#### POST `/api/journal`
Create a new journal entry

**Request Body:**
```json
{
  "patientId": "507f1f77bcf86cd799439011",
  "title": "A Great Day",
  "content": "Today was wonderful. I spent time with family...",
  "date": "2024-01-15T00:00:00.000Z"
}
```

#### PATCH `/api/journal/:id`
Update a journal entry

#### DELETE `/api/journal/:id`
Delete a journal entry

---

### Mood Entries

#### GET `/api/mood`
Get all mood entries with optional filters

**Query Parameters:**
- `patientId`: Filter by patient
- `startDate`: Filter by start date
- `endDate`: Filter by end date

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439016",
    "patientId": "507f1f77bcf86cd799439011",
    "mood": "HAPPY",
    "moodScore": 4,
    "notes": "Feeling great today!",
    "date": "2024-01-15T00:00:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

#### GET `/api/mood/:id`
Get a specific mood entry

#### GET `/api/mood/patient/:patientId/today`
Get today's mood entry for a patient

#### GET `/api/mood/patient/:patientId/stats`
Get mood statistics for a patient

**Query Parameters:**
- `startDate`: Optional start date for stats
- `endDate`: Optional end date for stats

**Response:**
```json
{
  "totalEntries": 30,
  "averageScore": 3.8,
  "moodDistribution": {
    "VERY_HAPPY": 8,
    "HAPPY": 12,
    "NEUTRAL": 7,
    "SAD": 2,
    "VERY_SAD": 1
  }
}
```

#### POST `/api/mood`
Create a new mood entry (one per patient per day)

**Request Body:**
```json
{
  "patientId": "507f1f77bcf86cd799439011",
  "mood": "HAPPY",  // VERY_SAD, SAD, NEUTRAL, HAPPY, or VERY_HAPPY
  "notes": "Feeling great today!",
  "date": "2024-01-15T00:00:00.000Z"
}
```

#### PATCH `/api/mood/:id`
Update a mood entry

#### DELETE `/api/mood/:id`
Delete a mood entry

---

### File Upload

#### POST `/api/upload`
Upload a single file (image or video)

**Request:**
- Content-Type: `multipart/form-data`
- Field name: `file`

**Supported formats:**
- Images: JPEG, PNG, GIF, WebP
- Videos: MP4, MPEG, MOV, WebM
- Max size: 100MB

**Response:**
```json
{
  "filename": "family-photo-1642251600000-123456789.jpg",
  "originalName": "family-photo.jpg",
  "mimeType": "image/jpeg",
  "size": 2048000,
  "url": "/uploads/family-photo-1642251600000-123456789.jpg",
  "path": "/absolute/path/to/uploads/family-photo-1642251600000-123456789.jpg"
}
```

#### POST `/api/upload/multiple`
Upload multiple files (max 10)

**Request:**
- Content-Type: `multipart/form-data`
- Field name: `files`

**Response:**
```json
[
  {
    "filename": "photo1-1642251600000-123456789.jpg",
    "originalName": "photo1.jpg",
    "mimeType": "image/jpeg",
    "size": 2048000,
    "url": "/uploads/photo1-1642251600000-123456789.jpg",
    "path": "/absolute/path/to/uploads/photo1-1642251600000-123456789.jpg"
  },
  {
    "filename": "video1-1642251600000-987654321.mp4",
    "originalName": "video1.mp4",
    "mimeType": "video/mp4",
    "size": 10240000,
    "url": "/uploads/video1-1642251600000-987654321.mp4",
    "path": "/absolute/path/to/uploads/video1-1642251600000-987654321.mp4"
  }
]
```

---

## Error Responses

All endpoints return appropriate HTTP status codes:

- `200 OK`: Successful GET/PATCH request
- `201 Created`: Successful POST request
- `400 Bad Request`: Invalid input or validation error
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

**Error Response Format:**
```json
{
  "error": "Error message description"
}
```

---

## Setup Instructions

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Set up environment variables (see `.env.example` in project root):
   ```
   MONGODB_URI=mongodb+srv://...
   MONGODB_DB=memorymap
   PORT=4000
   CORS_ORIGINS=http://localhost:3000
   ```

3. Run the server:
   ```bash
   npm run dev
   ```

4. Access API documentation:
   ```
   http://localhost:4000/api
   ```

---

## Database Indexes

The application automatically creates the following indexes for optimal performance:

- **users**: `role`, `caregiverId`, `name`
- **caregivers**: `name` (unique)
- **tasks**: `patientId + dueDate`, `caregiverId`, `completed + dueDate`
- **memories**: `patientId + createdAt`, `caregiverId`, `type`
- **journalEntries**: `patientId + date`, `createdAt`
- **moodEntries**: `patientId + date` (unique - one per day), `patientId + date`

---

## Workflow Examples

### 1. Patient Login and Check Mood
```javascript
// 1. Login
POST /api/login
{
  "name": "John Doe",
  "role": "PATIENT",
  "location": "New York",
  "caregiverName": "Jane Smith"
}

// 2. Check if mood entered today
GET /api/mood/patient/{patientId}/today

// 3. If not, create mood entry
POST /api/mood
{
  "patientId": "{patientId}",
  "mood": "HAPPY",
  "notes": "Feeling great!",
  "date": "2024-01-15T00:00:00.000Z"
}
```

### 2. Caregiver Assigns Task
```javascript
// 1. Get patient list
GET /api/caregivers/{caregiverId}/patients

// 2. Create task for patient
POST /api/tasks
{
  "patientId": "{patientId}",
  "caregiverId": "{caregiverId}",
  "title": "Take morning medication",
  "description": "Take 2 pills with breakfast",
  "dueDate": "2024-01-20T09:00:00.000Z",
  "priority": "HIGH"
}
```

### 3. Upload and Create Memory
```javascript
// 1. Upload file
POST /api/upload
FormData: { file: <file> }

// Response: { url: "/uploads/photo-123.jpg", ... }

// 2. Create memory record
POST /api/memories
{
  "patientId": "{patientId}",
  "caregiverId": "{caregiverId}",
  "type": "IMAGE",
  "url": "/uploads/photo-123.jpg",
  "title": "Family Photo",
  "description": "Summer vacation 2023",
  "fileSize": 2048000,
  "mimeType": "image/jpeg"
}
```
