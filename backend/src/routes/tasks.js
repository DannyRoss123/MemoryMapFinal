import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { Collections } from '../services/db.js';
import { getDb } from '../services/db.js';
import { TaskPriority } from '../models/schemas.js';

export const tasksRouter = Router();

// GET /api/tasks - Get all tasks (with optional filters)
// Query params: patientId, caregiverId, completed, startDate, endDate
tasksRouter.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const tasks = db.collection(Collections.TASKS);

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

    // Filter by completion status
    if (req.query.completed !== undefined) {
      query.completed = req.query.completed === 'true';
    }

    // Filter by date range
    if (req.query.startDate || req.query.endDate) {
      query.dueDate = {};
      if (req.query.startDate) {
        query.dueDate.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.dueDate.$lte = new Date(req.query.endDate);
      }
    }

    const taskList = await tasks.find(query).sort({ dueDate: -1 }).toArray();
    res.json(taskList);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/:id - Get a specific task
tasksRouter.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const tasks = db.collection(Collections.TASKS);

    const task = await tasks.findOne({ _id: new ObjectId(req.params.id) });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// POST /api/tasks - Create a new task
// Body: { patientId, caregiverId, title, description, dueDate, priority }
tasksRouter.post('/', async (req, res) => {
  try {
    const { patientId, caregiverId, title, description, dueDate, priority } = req.body;

    // Validation
    if (!patientId || !caregiverId || !title || !dueDate) {
      return res.status(400).json({ error: 'Missing required fields: patientId, caregiverId, title, dueDate' });
    }

    // Validate priority
    if (priority && !Object.values(TaskPriority).includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority value' });
    }

    const db = await getDb();
    const tasks = db.collection(Collections.TASKS);

    const newTask = {
      patientId: new ObjectId(patientId),
      caregiverId: new ObjectId(caregiverId),
      title: title.trim(),
      description: description?.trim() || '',
      dueDate: new Date(dueDate),
      completed: false,
      priority: priority || TaskPriority.MEDIUM,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await tasks.insertOne(newTask);
    const createdTask = await tasks.findOne({ _id: result.insertedId });

    console.log('✓ New task created:', {
      taskId: result.insertedId.toString(),
      patientId,
      title: newTask.title,
      dueDate: newTask.dueDate.toISOString(),
      priority: newTask.priority,
      timestamp: new Date().toISOString()
    });

    res.status(201).json(createdTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PATCH /api/tasks/:id - Update a task
// Body: { title, description, dueDate, priority, completed }
tasksRouter.patch('/:id', async (req, res) => {
  try {
    const { title, description, dueDate, priority, completed } = req.body;

    const db = await getDb();
    const tasks = db.collection(Collections.TASKS);

    const updateFields = { updatedAt: new Date() };

    if (title !== undefined) updateFields.title = title.trim();
    if (description !== undefined) updateFields.description = description.trim();
    if (dueDate !== undefined) updateFields.dueDate = new Date(dueDate);
    if (priority !== undefined) {
      if (!Object.values(TaskPriority).includes(priority)) {
        return res.status(400).json({ error: 'Invalid priority value' });
      }
      updateFields.priority = priority;
    }
    if (completed !== undefined) {
      updateFields.completed = completed;
      if (completed) {
        updateFields.completedAt = new Date();
      } else {
        updateFields.completedAt = null;
      }
    }

    const result = await tasks.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id - Delete a task
tasksRouter.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const tasks = db.collection(Collections.TASKS);

    const result = await tasks.deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// POST /api/tasks/:id/complete - Mark a task as complete
tasksRouter.post('/:id/complete', async (req, res) => {
  try {
    const db = await getDb();
    const tasks = db.collection(Collections.TASKS);

    const result = await tasks.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          completed: true,
          completedAt: new Date(),
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});
