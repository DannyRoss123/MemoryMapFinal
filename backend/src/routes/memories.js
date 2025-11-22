import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { Collections } from '../services/db.js';
import { getDb } from '../services/db.js';
import { MemoryType } from '../models/schemas.js';

export const memoriesRouter = Router();

// GET /api/memories - Get all memories (with optional filters)
// Query params: patientId, caregiverId, type
memoriesRouter.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const memories = db.collection(Collections.MEMORIES);

    const query = {};

    // Filter by patientId
    if (req.query.patientId) {
      try {
        query.patientId = new ObjectId(req.query.patientId);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid patientId format' });
      }
    }

    // Filter by caregiverId
    if (req.query.caregiverId) {
      try {
        query.caregiverId = new ObjectId(req.query.caregiverId);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid caregiverId format' });
      }
    }

    // Filter by type (IMAGE or VIDEO)
    if (req.query.type) {
      if (!Object.values(MemoryType).includes(req.query.type)) {
        return res.status(400).json({ error: 'Invalid type. Must be IMAGE or VIDEO' });
      }
      query.type = req.query.type;
    }

    const memoryList = await memories.find(query).sort({ createdAt: -1 }).toArray();
    res.json(memoryList);
  } catch (error) {
    console.error('Error fetching memories:', error);
    res.status(500).json({ error: 'Failed to fetch memories' });
  }
});

// GET /api/memories/:id - Get a specific memory
memoriesRouter.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const memories = db.collection(Collections.MEMORIES);

    const memory = await memories.findOne({ _id: new ObjectId(req.params.id) });

    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    res.json(memory);
  } catch (error) {
    console.error('Error fetching memory:', error);
    res.status(500).json({ error: 'Failed to fetch memory' });
  }
});

// POST /api/memories - Create a new memory
// Body: { patientId, caregiverId, type, url, title, description, caption, fileSize, mimeType }
memoriesRouter.post('/', async (req, res) => {
  try {
    const { patientId, caregiverId, type, url, title, description, caption, fileSize, mimeType } = req.body;

    // Validation
    if (!patientId || !caregiverId || !type || !url) {
      return res.status(400).json({ error: 'Missing required fields: patientId, caregiverId, type, url' });
    }

    // Validate type
    if (!Object.values(MemoryType).includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be IMAGE or VIDEO' });
    }

    const db = await getDb();
    const memories = db.collection(Collections.MEMORIES);

    const newMemory = {
      patientId: new ObjectId(patientId),
      caregiverId: new ObjectId(caregiverId),
      type,
      url,
      title: title?.trim() || '',
      description: description?.trim() || '',
      caption: caption?.trim() || '',
      fileSize: fileSize || null,
      mimeType: mimeType || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await memories.insertOne(newMemory);
    const createdMemory = await memories.findOne({ _id: result.insertedId });

    res.status(201).json(createdMemory);
  } catch (error) {
    console.error('Error creating memory:', error);
    res.status(500).json({ error: 'Failed to create memory' });
  }
});

// PATCH /api/memories/:id - Update a memory
// Body: { title, description, caption }
memoriesRouter.patch('/:id', async (req, res) => {
  try {
    const { title, description, caption } = req.body;

    const db = await getDb();
    const memories = db.collection(Collections.MEMORIES);

    const updateFields = { updatedAt: new Date() };

    if (title !== undefined) updateFields.title = title.trim();
    if (description !== undefined) updateFields.description = description.trim();
    if (caption !== undefined) updateFields.caption = caption.trim();

    const result = await memories.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error updating memory:', error);
    res.status(500).json({ error: 'Failed to update memory' });
  }
});

// DELETE /api/memories/:id - Delete a memory
memoriesRouter.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const memories = db.collection(Collections.MEMORIES);

    const result = await memories.deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    res.json({ message: 'Memory deleted successfully' });
  } catch (error) {
    console.error('Error deleting memory:', error);
    res.status(500).json({ error: 'Failed to delete memory' });
  }
});
