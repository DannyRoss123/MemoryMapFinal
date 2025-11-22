import { getDb } from '../services/db.js';

/**
 * Task Model
 * Represents daily tasks assigned to patients by caregivers
 */

const COLLECTION_NAME = 'tasks';

// Task priorities
export const TaskPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH'
};

/**
 * Task Schema Structure:
 * {
 *   _id: ObjectId,
 *   patientId: ObjectId (required, reference to User),
 *   caregiverId: ObjectId (required, reference to Caregiver),
 *   title: String (required),
 *   description: String,
 *   dueDate: Date (required),
 *   completed: Boolean (default: false),
 *   completedAt: Date,
 *   priority: String (LOW | MEDIUM | HIGH),
 *   createdAt: Date,
 *   updatedAt: Date
 * }
 */

class TaskModel {
  static async getCollection() {
    const db = await getDb();
    return db.collection(COLLECTION_NAME);
  }

  // Create indexes
  static async createIndexes() {
    const collection = await this.getCollection();
    await collection.createIndex({ patientId: 1, dueDate: -1 });
    await collection.createIndex({ caregiverId: 1 });
    await collection.createIndex({ completed: 1, dueDate: -1 });
    await collection.createIndex({ dueDate: 1 });
  }

  // Validation
  static validate(taskData) {
    const errors = [];

    if (!taskData.patientId) {
      errors.push('Patient ID is required');
    }

    if (!taskData.caregiverId) {
      errors.push('Caregiver ID is required');
    }

    if (!taskData.title || typeof taskData.title !== 'string' || !taskData.title.trim()) {
      errors.push('Title is required and must be a non-empty string');
    }

    if (!taskData.dueDate) {
      errors.push('Due date is required');
    }

    if (taskData.priority && !Object.values(TaskPriority).includes(taskData.priority)) {
      errors.push('Priority must be LOW, MEDIUM, or HIGH');
    }

    return errors;
  }

  // Create a new task
  static async create(taskData) {
    const errors = this.validate(taskData);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const collection = await this.getCollection();
    const now = new Date();

    const task = {
      patientId: taskData.patientId,
      caregiverId: taskData.caregiverId,
      title: taskData.title.trim(),
      description: taskData.description?.trim() || '',
      dueDate: new Date(taskData.dueDate),
      completed: false,
      completedAt: null,
      priority: taskData.priority || TaskPriority.MEDIUM,
      createdAt: now,
      updatedAt: now
    };

    const result = await collection.insertOne(task);
    return await collection.findOne({ _id: result.insertedId });
  }

  // Find task by ID
  static async findById(id) {
    const collection = await this.getCollection();
    return await collection.findOne({ _id: id });
  }

  // Find tasks by criteria
  static async find(query = {}, options = {}) {
    const collection = await this.getCollection();
    const { sort = { dueDate: -1 }, limit, skip } = options;

    let cursor = collection.find(query).sort(sort);

    if (skip) cursor = cursor.skip(skip);
    if (limit) cursor = cursor.limit(limit);

    return await cursor.toArray();
  }

  // Find tasks by patient
  static async findByPatient(patientId, options = {}) {
    return await this.find({ patientId }, options);
  }

  // Find tasks by caregiver
  static async findByCaregiver(caregiverId, options = {}) {
    return await this.find({ caregiverId }, options);
  }

  // Find completed tasks
  static async findCompleted(query = {}, options = {}) {
    return await this.find({ ...query, completed: true }, options);
  }

  // Find pending tasks
  static async findPending(query = {}, options = {}) {
    return await this.find({ ...query, completed: false }, options);
  }

  // Find overdue tasks
  static async findOverdue(patientId) {
    const now = new Date();
    return await this.find({
      patientId,
      completed: false,
      dueDate: { $lt: now }
    });
  }

  // Update task
  static async updateById(id, updateData) {
    const collection = await this.getCollection();
    const updateFields = { ...updateData, updatedAt: new Date() };

    return await collection.findOneAndUpdate(
      { _id: id },
      { $set: updateFields },
      { returnDocument: 'after' }
    );
  }

  // Mark task as complete
  static async markComplete(id) {
    const collection = await this.getCollection();

    return await collection.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          completed: true,
          completedAt: new Date(),
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );
  }

  // Mark task as incomplete
  static async markIncomplete(id) {
    const collection = await this.getCollection();

    return await collection.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          completed: false,
          completedAt: null,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );
  }

  // Delete task
  static async deleteById(id) {
    const collection = await this.getCollection();
    return await collection.deleteOne({ _id: id });
  }

  // Delete all tasks for a patient
  static async deleteByPatient(patientId) {
    const collection = await this.getCollection();
    return await collection.deleteMany({ patientId });
  }

  // Count tasks
  static async count(query = {}) {
    const collection = await this.getCollection();
    return await collection.countDocuments(query);
  }

  // Count completed tasks
  static async countCompleted(query = {}) {
    return await this.count({ ...query, completed: true });
  }

  // Count pending tasks
  static async countPending(query = {}) {
    return await this.count({ ...query, completed: false });
  }
}

export default TaskModel;
