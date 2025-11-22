import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { Collections } from '../services/db.js';
import { getDb } from '../services/db.js';

export const caregiversRouter = Router();

// GET /api/caregivers - Get all caregivers
caregiversRouter.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const caregivers = db.collection(Collections.CAREGIVERS);

    const caregiverList = await caregivers.find({}).sort({ createdAt: -1 }).toArray();
    res.json(caregiverList);
  } catch (error) {
    console.error('Error fetching caregivers:', error);
    res.status(500).json({ error: 'Failed to fetch caregivers' });
  }
});

// GET /api/caregivers/:id - Get a specific caregiver
caregiversRouter.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const caregivers = db.collection(Collections.CAREGIVERS);

    const caregiver = await caregivers.findOne({ _id: new ObjectId(req.params.id) });

    if (!caregiver) {
      return res.status(404).json({ error: 'Caregiver not found' });
    }

    res.json(caregiver);
  } catch (error) {
    console.error('Error fetching caregiver:', error);
    res.status(500).json({ error: 'Failed to fetch caregiver' });
  }
});

// GET /api/caregivers/:id/patients - Get all patients assigned to a caregiver
caregiversRouter.get('/:id/patients', async (req, res) => {
  try {
    const db = await getDb();
    const users = db.collection(Collections.USERS);

    const patients = await users
      .find({
        caregiverId: new ObjectId(req.params.id),
        role: 'PATIENT'
      })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(patients);
  } catch (error) {
    console.error('Error fetching caregiver patients:', error);
    res.status(500).json({ error: 'Failed to fetch caregiver patients' });
  }
});

// GET /api/caregivers/:id/dashboard - Get comprehensive caregiver dashboard data
// Includes: caregiver info, assigned patients, total tasks, pending tasks, recent activities
caregiversRouter.get('/:id/dashboard', async (req, res) => {
  try {
    const db = await getDb();
    const caregiverId = new ObjectId(req.params.id);

    // Get caregiver info
    const caregivers = db.collection(Collections.CAREGIVERS);
    const caregiver = await caregivers.findOne({ _id: caregiverId });

    if (!caregiver) {
      return res.status(404).json({ error: 'Caregiver not found' });
    }

    // Get assigned patients
    const users = db.collection(Collections.USERS);
    const patients = await users
      .find({ caregiverId, role: 'PATIENT' })
      .toArray();

    // Get task statistics
    const tasks = db.collection(Collections.TASKS);
    const totalTasks = await tasks.countDocuments({ caregiverId });
    const completedTasks = await tasks.countDocuments({ caregiverId, completed: true });
    const pendingTasks = totalTasks - completedTasks;

    // Get recent tasks created by this caregiver
    const recentTasks = await tasks
      .find({ caregiverId })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    // Get recent memories uploaded by this caregiver
    const memories = db.collection(Collections.MEMORIES);
    const recentMemories = await memories
      .find({ caregiverId })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    // Get mood summary for all patients
    const moodEntries = db.collection(Collections.MOOD_ENTRIES);
    const patientIds = patients.map(p => p._id);

    // Get today's mood entries for all patients
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysMoods = await moodEntries
      .find({
        patientId: { $in: patientIds },
        date: { $gte: today, $lt: tomorrow }
      })
      .toArray();

    res.json({
      caregiver,
      patients: {
        list: patients,
        total: patients.length
      },
      tasks: {
        recent: recentTasks,
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks
      },
      memories: {
        recent: recentMemories,
        total: await memories.countDocuments({ caregiverId })
      },
      todaysMoods
    });
  } catch (error) {
    console.error('Error fetching caregiver dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch caregiver dashboard' });
  }
});

// POST /api/caregivers - Create a new caregiver
// Body: { name, location, profileImage }
caregiversRouter.post('/', async (req, res) => {
  try {
    const { name, location, profileImage } = req.body;

    // Validation
    if (!name || !location) {
      return res.status(400).json({ error: 'Missing required fields: name, location' });
    }

    const db = await getDb();
    const caregivers = db.collection(Collections.CAREGIVERS);

    // Check if caregiver with this name already exists
    const existing = await caregivers.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ error: 'Caregiver with this name already exists' });
    }

    const newCaregiver = {
      name: name.trim(),
      location: location.trim(),
      profileImage: profileImage || null,
      patients: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await caregivers.insertOne(newCaregiver);
    const createdCaregiver = await caregivers.findOne({ _id: result.insertedId });

    res.status(201).json(createdCaregiver);
  } catch (error) {
    console.error('Error creating caregiver:', error);
    res.status(500).json({ error: 'Failed to create caregiver' });
  }
});

// PATCH /api/caregivers/:id - Update a caregiver
// Body: { name, location, profileImage }
caregiversRouter.patch('/:id', async (req, res) => {
  try {
    const { name, location, profileImage } = req.body;

    const db = await getDb();
    const caregivers = db.collection(Collections.CAREGIVERS);

    const updateFields = { updatedAt: new Date() };

    if (name !== undefined) {
      // Check if another caregiver has this name
      const existing = await caregivers.findOne({
        name: name.trim(),
        _id: { $ne: new ObjectId(req.params.id) }
      });
      if (existing) {
        return res.status(400).json({ error: 'Caregiver with this name already exists' });
      }
      updateFields.name = name.trim();
    }

    if (location !== undefined) updateFields.location = location.trim();
    if (profileImage !== undefined) updateFields.profileImage = profileImage;

    const result = await caregivers.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Caregiver not found' });
    }

    // If name was updated, update it in all patient records
    if (name !== undefined) {
      const users = db.collection(Collections.USERS);
      await users.updateMany(
        { caregiverId: new ObjectId(req.params.id), role: 'PATIENT' },
        { $set: { caregiverName: name.trim() } }
      );
    }

    res.json(result);
  } catch (error) {
    console.error('Error updating caregiver:', error);
    res.status(500).json({ error: 'Failed to update caregiver' });
  }
});

// DELETE /api/caregivers/:id - Delete a caregiver
caregiversRouter.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const caregivers = db.collection(Collections.CAREGIVERS);
    const users = db.collection(Collections.USERS);
    const caregiverId = new ObjectId(req.params.id);

    // Check if caregiver has assigned patients
    const assignedPatients = await users.countDocuments({
      caregiverId,
      role: 'PATIENT'
    });

    if (assignedPatients > 0) {
      return res.status(400).json({
        error: `Cannot delete caregiver with ${assignedPatients} assigned patient(s). Reassign patients first.`
      });
    }

    const result = await caregivers.deleteOne({ _id: caregiverId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Caregiver not found' });
    }

    // Also delete the user record for this caregiver
    await users.deleteOne({ caregiverId, role: 'CAREGIVER' });

    res.json({ message: 'Caregiver deleted successfully' });
  } catch (error) {
    console.error('Error deleting caregiver:', error);
    res.status(500).json({ error: 'Failed to delete caregiver' });
  }
});
