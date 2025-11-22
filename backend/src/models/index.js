/**
 * Models Index
 * Central export point for all database models
 */

import UserModel, { UserRoles } from './User.js';
import CaregiverModel from './Caregiver.js';
import TaskModel, { TaskPriority } from './Task.js';
import MemoryModel, { MemoryType } from './Memory.js';
import JournalEntryModel from './JournalEntry.js';
import MoodEntryModel, { MoodLevel, MoodScore } from './MoodEntry.js';

// Initialize all indexes
export async function initializeIndexes() {
  console.log('Creating database indexes...');

  try {
    await Promise.all([
      UserModel.createIndexes(),
      CaregiverModel.createIndexes(),
      TaskModel.createIndexes(),
      MemoryModel.createIndexes(),
      JournalEntryModel.createIndexes(),
      MoodEntryModel.createIndexes()
    ]);

    console.log('✓ Database indexes created successfully');
  } catch (error) {
    console.error('✗ Error creating indexes:', error);
    throw error;
  }
}

// Export all models
export {
  UserModel,
  CaregiverModel,
  TaskModel,
  MemoryModel,
  JournalEntryModel,
  MoodEntryModel
};

// Export constants
export {
  UserRoles,
  TaskPriority,
  MemoryType,
  MoodLevel,
  MoodScore
};

// Collection names
export const Collections = {
  USERS: 'users',
  CAREGIVERS: 'caregivers',
  TASKS: 'tasks',
  MEMORIES: 'memories',
  JOURNAL_ENTRIES: 'journalEntries',
  MOOD_ENTRIES: 'moodEntries'
};

export default {
  User: UserModel,
  Caregiver: CaregiverModel,
  Task: TaskModel,
  Memory: MemoryModel,
  JournalEntry: JournalEntryModel,
  MoodEntry: MoodEntryModel,
  Collections,
  UserRoles,
  TaskPriority,
  MemoryType,
  MoodLevel,
  MoodScore,
  initializeIndexes
};
