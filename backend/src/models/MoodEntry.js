import { getDb } from '../services/db.js';

/**
 * MoodEntry Model
 * Represents daily mood tracking for patients (one per patient per day)
 */

const COLLECTION_NAME = 'moodEntries';

// Mood levels
export const MoodLevel = {
  VERY_SAD: 'VERY_SAD',
  SAD: 'SAD',
  NEUTRAL: 'NEUTRAL',
  HAPPY: 'HAPPY',
  VERY_HAPPY: 'VERY_HAPPY'
};

// Mood scores (1-5 scale)
export const MoodScore = {
  VERY_SAD: 1,
  SAD: 2,
  NEUTRAL: 3,
  HAPPY: 4,
  VERY_HAPPY: 5
};

/**
 * MoodEntry Schema Structure:
 * {
 *   _id: ObjectId,
 *   patientId: ObjectId (required, reference to User),
 *   mood: String (VERY_SAD | SAD | NEUTRAL | HAPPY | VERY_HAPPY) (required),
 *   moodScore: Number (1-5, calculated from mood),
 *   notes: String (optional notes about their mood),
 *   date: Date (required, should be one per patient per day),
 *   createdAt: Date
 * }
 */

class MoodEntryModel {
  static async getCollection() {
    const db = await getDb();
    return db.collection(COLLECTION_NAME);
  }

  // Create indexes
  static async createIndexes() {
    const collection = await this.getCollection();
    await collection.createIndex({ patientId: 1, date: -1 });
    await collection.createIndex({ patientId: 1, date: 1 }, { unique: true }); // One per day
    await collection.createIndex({ date: -1 });
  }

  // Validation
  static validate(entryData) {
    const errors = [];

    if (!entryData.patientId) {
      errors.push('Patient ID is required');
    }

    if (!entryData.mood || !Object.values(MoodLevel).includes(entryData.mood)) {
      errors.push('Mood is required and must be VERY_SAD, SAD, NEUTRAL, HAPPY, or VERY_HAPPY');
    }

    if (!entryData.date) {
      errors.push('Date is required');
    }

    return errors;
  }

  // Create a new mood entry
  static async create(entryData) {
    const errors = this.validate(entryData);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const collection = await this.getCollection();

    // Normalize date to start of day
    const entryDate = new Date(entryData.date);
    entryDate.setHours(0, 0, 0, 0);

    const entry = {
      patientId: entryData.patientId,
      mood: entryData.mood,
      moodScore: MoodScore[entryData.mood],
      notes: entryData.notes?.trim() || '',
      date: entryDate,
      createdAt: new Date()
    };

    try {
      const result = await collection.insertOne(entry);
      return await collection.findOne({ _id: result.insertedId });
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Mood entry already exists for this date. Use update instead.');
      }
      throw error;
    }
  }

  // Find mood entry by ID
  static async findById(id) {
    const collection = await this.getCollection();
    return await collection.findOne({ _id: id });
  }

  // Find mood entries by criteria
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

  // Find today's mood entry for a patient
  static async findToday(patientId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const collection = await this.getCollection();
    return await collection.findOne({
      patientId,
      date: { $gte: today, $lt: tomorrow }
    });
  }

  // Find entries by date range
  static async findByDateRange(patientId, startDate, endDate, options = {}) {
    const query = {
      patientId,
      date: {}
    };

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      query.date.$gte = start;
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(0, 0, 0, 0);
      query.date.$lte = end;
    }

    return await this.find(query, options);
  }

  // Find entry for a specific date
  static async findByDate(patientId, date) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const collection = await this.getCollection();
    return await collection.findOne({
      patientId,
      date: { $gte: targetDate, $lt: nextDate }
    });
  }

  // Get mood statistics for a patient
  static async getStatistics(patientId, startDate = null, endDate = null) {
    const query = { patientId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);
        query.date.$lte = end;
      }
    }

    const entries = await this.find(query, { sort: { date: 1 } });

    if (entries.length === 0) {
      return {
        totalEntries: 0,
        averageScore: 0,
        moodDistribution: {},
        trend: null
      };
    }

    // Calculate statistics
    const totalEntries = entries.length;
    const averageScore = entries.reduce((sum, entry) => sum + entry.moodScore, 0) / totalEntries;

    const moodDistribution = entries.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {});

    // Calculate trend (simple linear regression)
    let trend = null;
    if (entries.length >= 2) {
      const scores = entries.map((e, i) => ({ x: i, y: e.moodScore }));
      const n = scores.length;
      const sumX = scores.reduce((sum, p) => sum + p.x, 0);
      const sumY = scores.reduce((sum, p) => sum + p.y, 0);
      const sumXY = scores.reduce((sum, p) => sum + p.x * p.y, 0);
      const sumX2 = scores.reduce((sum, p) => sum + p.x * p.x, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

      if (slope > 0.1) trend = 'improving';
      else if (slope < -0.1) trend = 'declining';
      else trend = 'stable';
    }

    return {
      totalEntries,
      averageScore: Math.round(averageScore * 100) / 100,
      moodDistribution,
      trend
    };
  }

  // Update mood entry
  static async updateById(id, updateData) {
    const collection = await this.getCollection();

    // If mood is being updated, recalculate score
    if (updateData.mood) {
      updateData.moodScore = MoodScore[updateData.mood];
    }

    return await collection.findOneAndUpdate(
      { _id: id },
      { $set: updateData },
      { returnDocument: 'after' }
    );
  }

  // Update or create mood entry for today
  static async upsertToday(patientId, moodData) {
    const collection = await this.getCollection();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const entry = {
      patientId,
      mood: moodData.mood,
      moodScore: MoodScore[moodData.mood],
      notes: moodData.notes?.trim() || '',
      date: today
    };

    return await collection.findOneAndUpdate(
      { patientId, date: today },
      {
        $set: entry,
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true, returnDocument: 'after' }
    );
  }

  // Delete mood entry
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
}

export default MoodEntryModel;
