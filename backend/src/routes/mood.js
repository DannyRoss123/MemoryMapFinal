import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { Collections } from '../services/db.js';
import { getDb } from '../services/db.js';
import { MoodLevel, MoodScore } from '../models/schemas.js';

export const moodRouter = Router();

// GET /api/mood - Get all mood entries (with optional filters)
// Query params: patientId, startDate, endDate
moodRouter.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const moodEntries = db.collection(Collections.MOOD_ENTRIES);

    const query = {};

    // Filter by patientId
    if (req.query.patientId) {
      try {
        query.patientId = new ObjectId(req.query.patientId);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid patientId format' });
      }
    }

    // Filter by date range
    if (req.query.startDate || req.query.endDate) {
      query.date = {};
      if (req.query.startDate) {
        query.date.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.date.$lte = new Date(req.query.endDate);
      }
    }

    const entries = await moodEntries.find(query).sort({ date: -1 }).toArray();
    res.json(entries);
  } catch (error) {
    console.error('Error fetching mood entries:', error);
    res.status(500).json({ error: 'Failed to fetch mood entries' });
  }
});

// GET /api/mood/:id - Get a specific mood entry
moodRouter.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const moodEntries = db.collection(Collections.MOOD_ENTRIES);

    const entry = await moodEntries.findOne({ _id: new ObjectId(req.params.id) });

    if (!entry) {
      return res.status(404).json({ error: 'Mood entry not found' });
    }

    res.json(entry);
  } catch (error) {
    console.error('Error fetching mood entry:', error);
    res.status(500).json({ error: 'Failed to fetch mood entry' });
  }
});

// GET /api/mood/patient/:patientId/today - Get today's mood entry for a patient
moodRouter.get('/patient/:patientId/today', async (req, res) => {
  try {
    const db = await getDb();
    const moodEntries = db.collection(Collections.MOOD_ENTRIES);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const entry = await moodEntries.findOne({
      patientId: new ObjectId(req.params.patientId),
      date: { $gte: today, $lt: tomorrow }
    });

    if (!entry) {
      return res.status(404).json({ error: 'No mood entry for today' });
    }

    res.json(entry);
  } catch (error) {
    console.error('Error fetching today\'s mood entry:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s mood entry' });
  }
});

// POST /api/mood - Create a new mood entry
// Body: { patientId, mood, notes, date }
moodRouter.post('/', async (req, res) => {
  try {
    const { patientId, mood, notes, date } = req.body;

    // Validation
    if (!patientId || !mood || !date) {
      return res.status(400).json({ error: 'Missing required fields: patientId, mood, date' });
    }

    // Validate mood
    if (!Object.values(MoodLevel).includes(mood)) {
      return res.status(400).json({
        error: 'Invalid mood value. Must be one of: HAPPY, CALM, SAD, ANXIOUS, ANGRY, TIRED'
      });
    }

    const db = await getDb();
    const moodEntries = db.collection(Collections.MOOD_ENTRIES);

    // Check if entry already exists for this patient on this date
    const entryDate = new Date(date);
    entryDate.setHours(0, 0, 0, 0);

    const nextDate = new Date(entryDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const existingEntry = await moodEntries.findOne({
      patientId: new ObjectId(patientId),
      date: { $gte: entryDate, $lt: nextDate }
    });

    if (existingEntry) {
      return res.status(400).json({
        error: 'Mood entry already exists for this date. Use PATCH to update it.'
      });
    }

    const newEntry = {
      patientId: new ObjectId(patientId),
      mood,
      moodScore: MoodScore[mood],
      notes: notes?.trim() || '',
      date: entryDate,
      createdAt: new Date()
    };

    const result = await moodEntries.insertOne(newEntry);
    const createdEntry = await moodEntries.findOne({ _id: result.insertedId });

    console.log('✓ New mood entry created:', {
      moodId: result.insertedId.toString(),
      patientId,
      mood: newEntry.mood,
      moodScore: newEntry.moodScore,
      date: newEntry.date.toISOString(),
      timestamp: new Date().toISOString()
    });

    res.status(201).json(createdEntry);
  } catch (error) {
    console.error('Error creating mood entry:', error);

    // Handle duplicate key error (unique index on patientId + date)
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Mood entry already exists for this date. Use PATCH to update it.'
      });
    }

    res.status(500).json({ error: 'Failed to create mood entry' });
  }
});

// PATCH /api/mood/:id - Update a mood entry
// Body: { mood, notes }
moodRouter.patch('/:id', async (req, res) => {
  try {
    const { mood, notes } = req.body;

    const db = await getDb();
    const moodEntries = db.collection(Collections.MOOD_ENTRIES);

    const updateFields = {};

    if (mood !== undefined) {
      // Validate mood
      if (!Object.values(MoodLevel).includes(mood)) {
        return res.status(400).json({
          error: 'Invalid mood value. Must be one of: HAPPY, CALM, SAD, ANXIOUS, ANGRY, TIRED'
        });
      }
      updateFields.mood = mood;
      updateFields.moodScore = MoodScore[mood];
    }

    if (notes !== undefined) {
      updateFields.notes = notes.trim();
    }

    const result = await moodEntries.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Mood entry not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error updating mood entry:', error);
    res.status(500).json({ error: 'Failed to update mood entry' });
  }
});

// DELETE /api/mood/:id - Delete a mood entry
moodRouter.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const moodEntries = db.collection(Collections.MOOD_ENTRIES);

    const result = await moodEntries.deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Mood entry not found' });
    }

    res.json({ message: 'Mood entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting mood entry:', error);
    res.status(500).json({ error: 'Failed to delete mood entry' });
  }
});

// GET /api/mood/patient/:patientId/stats - Get mood statistics for a patient
// Query params: startDate, endDate
moodRouter.get('/patient/:patientId/stats', async (req, res) => {
  try {
    const db = await getDb();
    const moodEntries = db.collection(Collections.MOOD_ENTRIES);

    const query = { patientId: new ObjectId(req.params.patientId) };

    // Filter by date range
    if (req.query.startDate || req.query.endDate) {
      query.date = {};
      if (req.query.startDate) {
        query.date.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.date.$lte = new Date(req.query.endDate);
      }
    }

    const entries = await moodEntries.find(query).toArray();

    if (entries.length === 0) {
      return res.json({
        totalEntries: 0,
        averageScore: 0,
        moodDistribution: {}
      });
    }

    // Calculate statistics
    const totalEntries = entries.length;
    const averageScore = entries.reduce((sum, entry) => sum + entry.moodScore, 0) / totalEntries;

    const moodDistribution = entries.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {});

    res.json({
      totalEntries,
      averageScore: Math.round(averageScore * 100) / 100,
      moodDistribution
    });
  } catch (error) {
    console.error('Error calculating mood stats:', error);
    res.status(500).json({ error: 'Failed to calculate mood statistics' });
  }
});
