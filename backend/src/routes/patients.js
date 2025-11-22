import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { Collections } from '../services/db.js';
import { getDb } from '../services/db.js';

export const patientsRouter = Router();

// GET /api/patients - Get all patients
// Query params: caregiverId (optional - filter by caregiver)
patientsRouter.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const users = db.collection(Collections.USERS);

    const query = { role: 'PATIENT' };

    // Filter by caregiverId if provided
    if (req.query.caregiverId) {
      try {
        query.caregiverId = new ObjectId(req.query.caregiverId);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid caregiverId format' });
      }
    }

    const patients = await users.find(query).sort({ createdAt: -1 }).toArray();
    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// GET /api/patients/:id - Get a specific patient
patientsRouter.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const users = db.collection(Collections.USERS);

    const patient = await users.findOne({
      _id: new ObjectId(req.params.id),
      role: 'PATIENT'
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(patient);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// GET /api/patients/:id/dashboard - Get comprehensive patient dashboard data
// Includes: patient info, recent tasks, recent memories, recent journal entries, recent mood
patientsRouter.get('/:id/dashboard', async (req, res) => {
  try {
    const db = await getDb();
    const patientId = new ObjectId(req.params.id);

    // Get patient info
    const users = db.collection(Collections.USERS);
    const patient = await users.findOne({ _id: patientId, role: 'PATIENT' });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Get recent tasks (limit 5)
    const tasks = db.collection(Collections.TASKS);
    const recentTasks = await tasks
      .find({ patientId })
      .sort({ dueDate: -1 })
      .limit(5)
      .toArray();

    // Get recent memories (limit 10)
    const memories = db.collection(Collections.MEMORIES);
    const recentMemories = await memories
      .find({ patientId })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    // Get recent journal entries (limit 5)
    const journalEntries = db.collection(Collections.JOURNAL_ENTRIES);
    const recentJournal = await journalEntries
      .find({ patientId })
      .sort({ date: -1 })
      .limit(5)
      .toArray();

    // Get recent mood entries (last 7 days)
    const moodEntries = db.collection(Collections.MOOD_ENTRIES);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentMood = await moodEntries
      .find({
        patientId,
        date: { $gte: sevenDaysAgo }
      })
      .sort({ date: -1 })
      .toArray();

    // Get task statistics
    const totalTasks = await tasks.countDocuments({ patientId });
    const completedTasks = await tasks.countDocuments({ patientId, completed: true });
    const pendingTasks = totalTasks - completedTasks;

    res.json({
      patient,
      tasks: {
        recent: recentTasks,
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks
      },
      memories: {
        recent: recentMemories,
        total: await memories.countDocuments({ patientId })
      },
      journal: {
        recent: recentJournal,
        total: await journalEntries.countDocuments({ patientId })
      },
      mood: {
        recent: recentMood
      }
    });
  } catch (error) {
    console.error('Error fetching patient dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch patient dashboard' });
  }
});

// PATCH /api/patients/:id - Update a patient
// Body: { name, location, caregiverId, profileImage }
patientsRouter.patch('/:id', async (req, res) => {
  try {
    const { name, location, caregiverId, profileImage } = req.body;

    const db = await getDb();
    const users = db.collection(Collections.USERS);
    const caregivers = db.collection(Collections.CAREGIVERS);

    const updateFields = { updatedAt: new Date() };

    if (name !== undefined) updateFields.name = name.trim();
    if (location !== undefined) updateFields.location = location.trim();
    if (profileImage !== undefined) updateFields.profileImage = profileImage;

    // If caregiverId is being updated, get the caregiver name
    if (caregiverId !== undefined) {
      if (caregiverId) {
        const caregiver = await caregivers.findOne({ _id: new ObjectId(caregiverId) });
        if (!caregiver) {
          return res.status(404).json({ error: 'Caregiver not found' });
        }
        updateFields.caregiverId = new ObjectId(caregiverId);
        updateFields.caregiverName = caregiver.name;
      } else {
        // Remove caregiver assignment
        updateFields.caregiverId = null;
        updateFields.caregiverName = null;
      }
    }

    const result = await users.findOneAndUpdate(
      { _id: new ObjectId(req.params.id), role: 'PATIENT' },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

// DELETE /api/patients/:id - Delete a patient
patientsRouter.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const users = db.collection(Collections.USERS);
    const patientId = new ObjectId(req.params.id);

    const result = await users.deleteOne({ _id: patientId, role: 'PATIENT' });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Optionally: Clean up related data (tasks, memories, journal, mood entries)
    // This is commented out in case you want to keep historical data
    /*
    const tasks = db.collection(Collections.TASKS);
    const memories = db.collection(Collections.MEMORIES);
    const journalEntries = db.collection(Collections.JOURNAL_ENTRIES);
    const moodEntries = db.collection(Collections.MOOD_ENTRIES);

    await Promise.all([
      tasks.deleteMany({ patientId }),
      memories.deleteMany({ patientId }),
      journalEntries.deleteMany({ patientId }),
      moodEntries.deleteMany({ patientId })
    ]);
    */

    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});
