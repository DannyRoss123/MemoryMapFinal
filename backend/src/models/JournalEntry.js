import { getDb } from '../services/db.js';

/**
 * JournalEntry Model
 * Represents journal entries written by patients
 */

const COLLECTION_NAME = 'journalEntries';

/**
 * JournalEntry Schema Structure:
 * {
 *   _id: ObjectId,
 *   patientId: ObjectId (required, reference to User),
 *   content: String (required),
 *   title: String,
 *   date: Date (required, the date the entry is about),
 *   createdAt: Date,
 *   updatedAt: Date
 * }
 */

class JournalEntryModel {
  static async getCollection() {
    const db = await getDb();
    return db.collection(COLLECTION_NAME);
  }

  // Create indexes
  static async createIndexes() {
    const collection = await this.getCollection();
    await collection.createIndex({ patientId: 1, date: -1 });
    await collection.createIndex({ createdAt: -1 });
    await collection.createIndex({ date: -1 });
  }

  // Validation
  static validate(entryData) {
    const errors = [];

    if (!entryData.patientId) {
      errors.push('Patient ID is required');
    }

    if (!entryData.content || typeof entryData.content !== 'string' || !entryData.content.trim()) {
      errors.push('Content is required and must be a non-empty string');
    }

    if (!entryData.date) {
      errors.push('Date is required');
    }

    return errors;
  }

  // Create a new journal entry
  static async create(entryData) {
    const errors = this.validate(entryData);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const collection = await this.getCollection();
    const now = new Date();

    const entry = {
      patientId: entryData.patientId,
      content: entryData.content.trim(),
      title: entryData.title?.trim() || '',
      date: new Date(entryData.date),
      createdAt: now,
      updatedAt: now
    };

    const result = await collection.insertOne(entry);
    return await collection.findOne({ _id: result.insertedId });
  }

  // Find journal entry by ID
  static async findById(id) {
    const collection = await this.getCollection();
    return await collection.findOne({ _id: id });
  }

  // Find journal entries by criteria
  static async find(query = {}, options = {}) {
    const collection = await this.getCollection();
    const { sort = { date: -1 }, limit, skip } = options;

    let cursor = collection.find(query).sort(sort);

    if (skip) cursor = cursor.skip(skip);
    if (limit) cursor = cursor.limit(limit);

    return await cursor.toArray();
  }

  // Find entries by patient
  static async findByPatient(patientId, options = {}) {
    return await this.find({ patientId }, options);
  }

  // Find entries by date range
  static async findByDateRange(patientId, startDate, endDate, options = {}) {
    const query = {
      patientId,
      date: {}
    };

    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);

    return await this.find(query, options);
  }

  // Find entries for a specific date
  static async findByDate(patientId, date) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    return await this.find({
      patientId,
      date: { $gte: targetDate, $lt: nextDate }
    });
  }

  // Find recent entries
  static async findRecent(patientId, limit = 10) {
    return await this.findByPatient(patientId, { limit, sort: { date: -1 } });
  }

  // Update journal entry
  static async updateById(id, updateData) {
    const collection = await this.getCollection();
    const updateFields = { ...updateData, updatedAt: new Date() };

    return await collection.findOneAndUpdate(
      { _id: id },
      { $set: updateFields },
      { returnDocument: 'after' }
    );
  }

  // Delete journal entry
  static async deleteById(id) {
    const collection = await this.getCollection();
    return await collection.deleteOne({ _id: id });
  }

  // Delete all entries for a patient
  static async deleteByPatient(patientId) {
    const collection = await this.getCollection();
    return await collection.deleteMany({ patientId });
  }

  // Count entries
  static async count(query = {}) {
    const collection = await this.getCollection();
    return await collection.countDocuments(query);
  }

  // Count entries by patient
  static async countByPatient(patientId) {
    return await this.count({ patientId });
  }

  // Search entries by content
  static async search(patientId, searchText, options = {}) {
    const collection = await this.getCollection();
    const { limit, skip } = options;

    const query = {
      patientId,
      $or: [
        { content: { $regex: searchText, $options: 'i' } },
        { title: { $regex: searchText, $options: 'i' } }
      ]
    };

    let cursor = collection.find(query).sort({ date: -1 });

    if (skip) cursor = cursor.skip(skip);
    if (limit) cursor = cursor.limit(limit);

    return await cursor.toArray();
  }
}

export default JournalEntryModel;
