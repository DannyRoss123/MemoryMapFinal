# Models Documentation

## Overview

This backend follows best practices by separating each MongoDB collection into its own model file. Each model provides a clean interface for database operations with built-in validation, indexes, and helper methods.

## Model Structure

All models follow the same pattern:
1. **Collection Name** - Defined as a constant
2. **Schema Documentation** - JSDoc comments describing the data structure
3. **Validation** - Input validation before database operations
4. **CRUD Operations** - Create, Read, Update, Delete methods
5. **Helper Methods** - Specific queries and operations for the model
6. **Index Management** - Automatic index creation for performance

---

## Models

### 1. User Model ([models/User.js](src/models/User.js))

Represents both patients and caregivers in the system.

**Collection**: `users`

**Schema**:
```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (optional, unique),
  role: String (PATIENT | CAREGIVER) (required),
  location: String (required),
  caregiverId: ObjectId (for patients),
  caregiverName: String (denormalized),
  profileImage: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Key Methods**:
- `create(userData)` - Create new user
- `findById(id)` - Find user by ID
- `findPatients(query)` - Find all patients
- `findCaregivers(query)` - Find all caregivers
- `findPatientsByCaregiver(caregiverId)` - Find patients by caregiver
- `updateById(id, data)` - Update user
- `deleteById(id)` - Delete user
- `upsert(query, data)` - Update or create user

**Indexes**:
- `role` - For filtering by role
- `caregiverId` - For finding patients by caregiver
- `email` - Unique index for email
- `name + role` - Composite index

**Example Usage**:
```javascript
import { UserModel, UserRoles } from './models/index.js';

// Create a patient
const patient = await UserModel.create({
  name: "John Doe",
  role: UserRoles.PATIENT,
  location: "New York",
  caregiverId: new ObjectId("..."),
  caregiverName: "Jane Smith"
});

// Find all patients
const patients = await UserModel.findPatients();

// Find patients by caregiver
const myPatients = await UserModel.findPatientsByCaregiver(caregiverId);
```

---

### 2. Caregiver Model ([models/Caregiver.js](src/models/Caregiver.js))

Extended information for caregivers.

**Collection**: `caregivers`

**Schema**:
```javascript
{
  _id: ObjectId,
  name: String (required, unique),
  email: String (optional, unique),
  location: String (required),
  profileImage: String,
  phone: String,
  specialty: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Key Methods**:
- `create(caregiverData)` - Create new caregiver
- `findById(id)` - Find by ID
- `findByName(name)` - Find by exact name
- `findByNameCaseInsensitive(name)` - Case-insensitive name search
- `findAll()` - Get all caregivers
- `existsByName(name)` - Check if name exists
- `updateById(id, data)` - Update caregiver
- `deleteById(id)` - Delete caregiver
- `count(query)` - Count caregivers

**Indexes**:
- `name` - Unique index
- `email` - Unique sparse index

**Example Usage**:
```javascript
import { CaregiverModel } from './models/index.js';

// Create caregiver
const caregiver = await CaregiverModel.create({
  name: "Jane Smith",
  location: "New York",
  email: "jane@example.com",
  phone: "555-1234"
});

// Find by name (case-insensitive)
const found = await CaregiverModel.findByNameCaseInsensitive("jane smith");
```

---

### 3. Task Model ([models/Task.js](src/models/Task.js))

Daily tasks assigned to patients by caregivers.

**Collection**: `tasks`

**Schema**:
```javascript
{
  _id: ObjectId,
  patientId: ObjectId (required),
  caregiverId: ObjectId (required),
  title: String (required),
  description: String,
  dueDate: Date (required),
  completed: Boolean (default: false),
  completedAt: Date,
  priority: String (LOW | MEDIUM | HIGH),
  createdAt: Date,
  updatedAt: Date
}
```

**Key Methods**:
- `create(taskData)` - Create new task
- `findById(id)` - Find by ID
- `findByPatient(patientId, options)` - Find patient's tasks
- `findByCaregiver(caregiverId, options)` - Find caregiver's tasks
- `findCompleted(query, options)` - Find completed tasks
- `findPending(query, options)` - Find pending tasks
- `findOverdue(patientId)` - Find overdue tasks
- `markComplete(id)` - Mark as complete
- `markIncomplete(id)` - Mark as incomplete
- `updateById(id, data)` - Update task
- `deleteById(id)` - Delete task
- `countCompleted(query)` - Count completed tasks
- `countPending(query)` - Count pending tasks

**Indexes**:
- `patientId + dueDate` - For patient task queries
- `caregiverId` - For caregiver queries
- `completed + dueDate` - For filtering by status
- `dueDate` - For date-based queries

**Example Usage**:
```javascript
import { TaskModel, TaskPriority } from './models/index.js';

// Create task
const task = await TaskModel.create({
  patientId: new ObjectId("..."),
  caregiverId: new ObjectId("..."),
  title: "Take morning medication",
  description: "Take 2 pills with breakfast",
  dueDate: new Date("2024-01-20T09:00:00"),
  priority: TaskPriority.HIGH
});

// Find patient's pending tasks
const pending = await TaskModel.findPending({ patientId });

// Mark as complete
await TaskModel.markComplete(taskId);

// Find overdue tasks
const overdue = await TaskModel.findOverdue(patientId);
```

---

### 4. Memory Model ([models/Memory.js](src/models/Memory.js))

Images and videos uploaded for patients.

**Collection**: `memories`

**Schema**:
```javascript
{
  _id: ObjectId,
  patientId: ObjectId (required),
  caregiverId: ObjectId (required),
  type: String (IMAGE | VIDEO) (required),
  url: String (required),
  title: String,
  description: String,
  caption: String,
  fileSize: Number,
  mimeType: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Key Methods**:
- `create(memoryData)` - Create new memory
- `findById(id)` - Find by ID
- `findByPatient(patientId, options)` - Find patient's memories
- `findByCaregiver(caregiverId, options)` - Find caregiver's uploads
- `findImages(query, options)` - Find only images
- `findVideos(query, options)` - Find only videos
- `findByType(type, query, options)` - Find by type
- `updateById(id, data)` - Update memory
- `deleteById(id)` - Delete memory
- `countByPatient(patientId)` - Count patient's memories
- `countByType(type, query)` - Count by type

**Indexes**:
- `patientId + createdAt` - For patient memory queries
- `caregiverId` - For caregiver queries
- `type` - For filtering by type
- `createdAt` - For chronological queries

**Example Usage**:
```javascript
import { MemoryModel, MemoryType } from './models/index.js';

// Create memory
const memory = await MemoryModel.create({
  patientId: new ObjectId("..."),
  caregiverId: new ObjectId("..."),
  type: MemoryType.IMAGE,
  url: "/uploads/photo-123.jpg",
  title: "Family Reunion",
  description: "Summer 2023",
  fileSize: 2048000,
  mimeType: "image/jpeg"
});

// Find patient's images
const images = await MemoryModel.findImages({ patientId });

// Find recent memories (limit 10)
const recent = await MemoryModel.findByPatient(patientId, { limit: 10 });
```

---

### 5. JournalEntry Model ([models/JournalEntry.js](src/models/JournalEntry.js))

Journal entries written by patients.

**Collection**: `journalEntries`

**Schema**:
```javascript
{
  _id: ObjectId,
  patientId: ObjectId (required),
  content: String (required),
  title: String,
  date: Date (required),
  createdAt: Date,
  updatedAt: Date
}
```

**Key Methods**:
- `create(entryData)` - Create new entry
- `findById(id)` - Find by ID
- `findByPatient(patientId, options)` - Find patient's entries
- `findByDateRange(patientId, start, end, options)` - Find by date range
- `findByDate(patientId, date)` - Find for specific date
- `findRecent(patientId, limit)` - Find recent entries
- `search(patientId, searchText, options)` - Search content
- `updateById(id, data)` - Update entry
- `deleteById(id)` - Delete entry
- `countByPatient(patientId)` - Count entries

**Indexes**:
- `patientId + date` - For patient queries by date
- `createdAt` - For chronological queries
- `date` - For date-based queries

**Example Usage**:
```javascript
import { JournalEntryModel } from './models/index.js';

// Create entry
const entry = await JournalEntryModel.create({
  patientId: new ObjectId("..."),
  title: "A Great Day",
  content: "Today was wonderful...",
  date: new Date("2024-01-15")
});

// Find recent entries (last 10)
const recent = await JournalEntryModel.findRecent(patientId, 10);

// Search entries
const results = await JournalEntryModel.search(
  patientId,
  "family",
  { limit: 20 }
);

// Find by date range
const entries = await JournalEntryModel.findByDateRange(
  patientId,
  new Date("2024-01-01"),
  new Date("2024-01-31")
);
```

---

### 6. MoodEntry Model ([models/MoodEntry.js](src/models/MoodEntry.js))

Daily mood tracking for patients (one entry per patient per day).

**Collection**: `moodEntries`

**Schema**:
```javascript
{
  _id: ObjectId,
  patientId: ObjectId (required),
  mood: String (VERY_SAD | SAD | NEUTRAL | HAPPY | VERY_HAPPY) (required),
  moodScore: Number (1-5, calculated),
  notes: String,
  date: Date (required, normalized to start of day),
  createdAt: Date
}
```

**Key Methods**:
- `create(entryData)` - Create new entry (one per day)
- `findById(id)` - Find by ID
- `findByPatient(patientId, options)` - Find patient's entries
- `findToday(patientId)` - Get today's mood
- `findByDateRange(patientId, start, end, options)` - Find by date range
- `findByDate(patientId, date)` - Find for specific date
- `getStatistics(patientId, start, end)` - Get mood statistics
- `upsertToday(patientId, moodData)` - Update/create today's mood
- `updateById(id, data)` - Update entry
- `deleteById(id)` - Delete entry

**Indexes**:
- `patientId + date (desc)` - For queries
- `patientId + date (asc)` - Unique index (one per day)
- `date` - For date-based queries

**Statistics**:
The `getStatistics()` method returns:
```javascript
{
  totalEntries: Number,
  averageScore: Number,
  moodDistribution: {
    VERY_HAPPY: Number,
    HAPPY: Number,
    NEUTRAL: Number,
    SAD: Number,
    VERY_SAD: Number
  },
  trend: 'improving' | 'declining' | 'stable' | null
}
```

**Example Usage**:
```javascript
import { MoodEntryModel, MoodLevel } from './models/index.js';

// Create mood entry
const mood = await MoodEntryModel.create({
  patientId: new ObjectId("..."),
  mood: MoodLevel.HAPPY,
  notes: "Feeling great today!",
  date: new Date()
});

// Get today's mood
const today = await MoodEntryModel.findToday(patientId);

// Get statistics for last 30 days
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const stats = await MoodEntryModel.getStatistics(
  patientId,
  thirtyDaysAgo,
  new Date()
);

// Update or create today's mood
const updated = await MoodEntryModel.upsertToday(patientId, {
  mood: MoodLevel.VERY_HAPPY,
  notes: "Best day ever!"
});
```

---

## Using Models in Routes

All models are exported from `models/index.js` for easy importing:

```javascript
import {
  UserModel,
  CaregiverModel,
  TaskModel,
  MemoryModel,
  JournalEntryModel,
  MoodEntryModel,
  UserRoles,
  TaskPriority,
  MemoryType,
  MoodLevel,
  MoodScore
} from '../models/index.js';
```

Example route using models:

```javascript
import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { TaskModel, TaskPriority } from '../models/index.js';

export const tasksRouter = Router();

// GET /api/tasks
tasksRouter.get('/', async (req, res) => {
  try {
    const { patientId, completed } = req.query;

    const query = {};
    if (patientId) query.patientId = new ObjectId(patientId);

    const tasks = completed === 'true'
      ? await TaskModel.findCompleted(query)
      : await TaskModel.findPending(query);

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tasks
tasksRouter.post('/', async (req, res) => {
  try {
    const task = await TaskModel.create({
      patientId: new ObjectId(req.body.patientId),
      caregiverId: new ObjectId(req.body.caregiverId),
      title: req.body.title,
      description: req.body.description,
      dueDate: new Date(req.body.dueDate),
      priority: req.body.priority || TaskPriority.MEDIUM
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

---

## Benefits of This Approach

1. **Separation of Concerns** - Each model handles its own data and logic
2. **Built-in Validation** - All models validate data before database operations
3. **Reusable Methods** - Common queries are encapsulated in model methods
4. **Type Safety** - Clear schema documentation and exported constants
5. **Maintainability** - Easy to find and update specific model logic
6. **Testability** - Models can be tested independently
7. **Performance** - Automatic index creation for optimal queries
8. **Clean Routes** - Route handlers stay focused on HTTP logic

---

## Model Constants

All enums and constants are exported for type safety:

```javascript
// User roles
UserRoles.PATIENT
UserRoles.CAREGIVER

// Task priorities
TaskPriority.LOW
TaskPriority.MEDIUM
TaskPriority.HIGH

// Memory types
MemoryType.IMAGE
MemoryType.VIDEO

// Mood levels
MoodLevel.VERY_SAD
MoodLevel.SAD
MoodLevel.NEUTRAL
MoodLevel.HAPPY
MoodLevel.VERY_HAPPY

// Mood scores
MoodScore.VERY_SAD    // 1
MoodScore.SAD         // 2
MoodScore.NEUTRAL     // 3
MoodScore.HAPPY       // 4
MoodScore.VERY_HAPPY  // 5
```

---

## Index Initialization

All indexes are automatically created on first database connection:

```javascript
import { initializeIndexes } from './models/index.js';

// Called automatically in db.js
await initializeIndexes();
```

This ensures optimal query performance without manual index management.
