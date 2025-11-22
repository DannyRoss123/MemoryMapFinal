import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { Collections } from '../services/db.js';
import { getDb } from '../services/db.js';

export const journalRouter = Router();

// GET /api/journal - Get all journal entries (with optional filters)
// Query params: patientId, startDate, endDate
journalRouter.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const journalEntries = db.collection(Collections.JOURNAL_ENTRIES);

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

    const entries = await journalEntries.find(query).sort({ date: -1 }).toArray();
    res.json(entries);
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    res.status(500).json({ error: 'Failed to fetch journal entries' });
  }
});

// GET /api/journal/:id - Get a specific journal entry
journalRouter.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const journalEntries = db.collection(Collections.JOURNAL_ENTRIES);

    const entry = await journalEntries.findOne({ _id: new ObjectId(req.params.id) });

    if (!entry) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    res.json(entry);
  } catch (error) {
    console.error('Error fetching journal entry:', error);
    res.status(500).json({ error: 'Failed to fetch journal entry' });
  }
});

// POST /api/journal - Create a new journal entry
// Body: { patientId, content, title, date }
journalRouter.post('/', async (req, res) => {
  try {
    const { patientId, content, title, date } = req.body;

    // Validation
    if (!patientId || !content || !date) {
      return res.status(400).json({ error: 'Missing required fields: patientId, content, date' });
    }

    const db = await getDb();
    const journalEntries = db.collection(Collections.JOURNAL_ENTRIES);

    const newEntry = {
      patientId: new ObjectId(patientId),
      content: content.trim(),
      title: title?.trim() || '',
      date: new Date(date),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await journalEntries.insertOne(newEntry);
    const createdEntry = await journalEntries.findOne({ _id: result.insertedId });

    res.status(201).json(createdEntry);
  } catch (error) {
    console.error('Error creating journal entry:', error);
    res.status(500).json({ error: 'Failed to create journal entry' });
  }
});

// PATCH /api/journal/:id - Update a journal entry
// Body: { content, title, date }
journalRouter.patch('/:id', async (req, res) => {
  try {
    const { content, title, date } = req.body;

    const db = await getDb();
    const journalEntries = db.collection(Collections.JOURNAL_ENTRIES);

    const updateFields = { updatedAt: new Date() };

    if (content !== undefined) updateFields.content = content.trim();
    if (title !== undefined) updateFields.title = title.trim();
    if (date !== undefined) updateFields.date = new Date(date);

    const result = await journalEntries.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error updating journal entry:', error);
    res.status(500).json({ error: 'Failed to update journal entry' });
  }
});

// DELETE /api/journal/:id - Delete a journal entry
journalRouter.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const journalEntries = db.collection(Collections.JOURNAL_ENTRIES);

    const result = await journalEntries.deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    res.json({ message: 'Journal entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    res.status(500).json({ error: 'Failed to delete journal entry' });
  }
});
