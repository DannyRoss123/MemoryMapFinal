/**
 * MongoDB Schema Definitions
 * This file defines the structure and validation for all collections
 */

export const Collections = {
  USERS: 'users',
  CAREGIVERS: 'caregivers',
  TASKS: 'tasks',
  MEMORIES: 'memories',
  JOURNAL_ENTRIES: 'journalEntries',
  MOOD_ENTRIES: 'moodEntries',
  CONTACTS: 'contacts'
};

/**
 * User Schema
 * Represents both patients and caregivers
 *
 * Fields:
 * - name: String (required)
 * - role: String (PATIENT | CAREGIVER) (required)
 * - location: String (required)
 * - caregiverId: ObjectId (for patients - reference to their assigned caregiver)
 * - caregiverName: String (denormalized for quick access)
 * - profileImage: String (URL or path to profile image)
 * - createdAt: Date
 * - updatedAt: Date
 */

/**
 * Caregiver Schema
 * Extended information for caregivers
 *
 * Fields:
 * - name: String (required)
 * - location: String (required)
 * - profileImage: String (URL or path to profile image)
 * - patients: Array<ObjectId> (list of assigned patient IDs)
 * - createdAt: Date
 * - updatedAt: Date
 */

/**
 * Task Schema
 * Daily tasks assigned to patients by caregivers
 *
 * Fields:
 * - patientId: ObjectId (required - reference to user with role PATIENT)
 * - caregiverId: ObjectId (required - who assigned the task)
 * - title: String (required)
 * - description: String
 * - dueDate: Date (required)
 * - completed: Boolean (default: false)
 * - completedAt: Date
 * - priority: String (LOW | MEDIUM | HIGH)
 * - createdAt: Date
 * - updatedAt: Date
 */

/**
 * Memory Schema
 * Images and videos uploaded by caregivers for patients
 *
 * Fields:
 * - patientId: ObjectId (required)
 * - caregiverId: ObjectId (required - who uploaded it)
 * - type: String (IMAGE | VIDEO) (required)
 * - url: String (required - path to file or URL)
 * - title: String
 * - description: String
 * - caption: String
 * - fileSize: Number (in bytes)
 * - mimeType: String
 * - createdAt: Date
 * - updatedAt: Date
 */

/**
 * JournalEntry Schema
 * Journal entries written by patients
 *
 * Fields:
 * - patientId: ObjectId (required)
 * - content: String (required)
 * - title: String
 * - date: Date (required - the date the entry is about)
 * - createdAt: Date
 * - updatedAt: Date
 */

/**
 * MoodEntry Schema
 * Daily mood tracking for patients
 *
 * Fields:
 * - patientId: ObjectId (required)
 * - mood: String (HAPPY | CALM | SAD | ANXIOUS | ANGRY | TIRED) (required)
 * - moodScore: Number (1-5, where 5 is HAPPY and 1 is ANGRY)
 * - notes: String (optional notes about their mood)
 * - date: Date (required - should be one per day)
 * - createdAt: Date
 */

/**
 * Contact Schema
 * Important contacts for patients
 *
 * Fields:
 * - patientId: ObjectId (required - reference to patient who owns this contact)
 * - firstName: String (required)
 * - lastName: String (required)
 * - middleName: String (optional)
 * - email: String (optional)
 * - phoneNumber: String (optional)
 * - profilePicture: String (optional - URL or path to profile picture)
 * - relationship: String (required - e.g., "Family", "Friend", "Doctor", "Caregiver")
 * - createdAt: Date
 * - updatedAt: Date
 */

// Validation helpers
export const UserRoles = {
  PATIENT: 'PATIENT',
  CAREGIVER: 'CAREGIVER'
};

export const TaskPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH'
};

export const MemoryType = {
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO'
};

export const MoodLevel = {
  ANGRY: 'ANGRY',
  SAD: 'SAD',
  ANXIOUS: 'ANXIOUS',
  TIRED: 'TIRED',
  CALM: 'CALM',
  HAPPY: 'HAPPY'
};

export const MoodScore = {
  ANGRY: 1,
  SAD: 2,
  ANXIOUS: 2,
  TIRED: 3,
  CALM: 4,
  HAPPY: 5
};

// Indexes for optimal query performance
export const indexes = {
  users: [
    { key: { role: 1 } },
    { key: { caregiverId: 1 } },
    { key: { name: 1 }, unique: false }
  ],
  caregivers: [
    { key: { name: 1 }, unique: true }
  ],
  tasks: [
    { key: { patientId: 1, dueDate: -1 } },
    { key: { caregiverId: 1 } },
    { key: { completed: 1, dueDate: -1 } }
  ],
  memories: [
    { key: { patientId: 1, createdAt: -1 } },
    { key: { caregiverId: 1 } },
    { key: { type: 1 } }
  ],
  journalEntries: [
    { key: { patientId: 1, date: -1 } },
    { key: { createdAt: -1 } }
  ],
  moodEntries: [
    { key: { patientId: 1, date: -1 } },
    { key: { patientId: 1, date: 1 }, unique: true } // One mood entry per patient per day
  ],
  contacts: [
    { key: { patientId: 1, createdAt: -1 } },
    { key: { patientId: 1, relationship: 1 } }
  ]
};
