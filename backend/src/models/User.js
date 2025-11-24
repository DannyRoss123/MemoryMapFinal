import { getDb } from '../services/db.js';

/**
 * User Model
 * Represents both patients and caregivers in the system
 */

const COLLECTION_NAME = 'users';

// User roles
export const UserRoles = {
  PATIENT: 'PATIENT',
  CAREGIVER: 'CAREGIVER'
};

/**
 * User Schema Structure:
 * {
 *   _id: ObjectId,
 *   name: String (required),
 *   email: String (optional, unique),
 *   role: String (PATIENT | CAREGIVER) (required),
 *   location: String (required),
 *   caregiverId: ObjectId (for patients - reference to caregiver),
 *   caregiverName: String (denormalized for quick access),
 *   profilePicture: String (URL or path),
 *   createdAt: Date,
 *   updatedAt: Date
 * }
 */

class UserModel {
  static async getCollection() {
    const db = await getDb();
    return db.collection(COLLECTION_NAME);
  }

  // Create indexes
  static async createIndexes() {
    const collection = await this.getCollection();
    await collection.createIndex({ role: 1 });
    await collection.createIndex({ caregiverId: 1 });
    await collection.createIndex({ email: 1 }, { unique: true, sparse: true });
    await collection.createIndex({ name: 1, role: 1 });
  }

  // Validation
  static validate(userData) {
    const errors = [];

    if (!userData.name || typeof userData.name !== 'string' || !userData.name.trim()) {
      errors.push('Name is required and must be a non-empty string');
    }

    if (!userData.role || !Object.values(UserRoles).includes(userData.role)) {
      errors.push('Role is required and must be either PATIENT or CAREGIVER');
    }

    if (!userData.location || typeof userData.location !== 'string' || !userData.location.trim()) {
      errors.push('Location is required and must be a non-empty string');
    }

    if (userData.email && typeof userData.email !== 'string') {
      errors.push('Email must be a string');
    }

    return errors;
  }

  // Create a new user
  static async create(userData) {
    const errors = this.validate(userData);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const collection = await this.getCollection();
    const now = new Date();

    const user = {
      name: userData.name.trim(),
      email: userData.email?.trim() || null,
      role: userData.role,
      location: userData.location.trim(),
      caregiverId: userData.caregiverId || null,
      caregiverName: userData.caregiverName || null,
      profilePicture: userData.profilePicture || null,
      createdAt: now,
      updatedAt: now
    };

    const result = await collection.insertOne(user);
    return await collection.findOne({ _id: result.insertedId });
  }

  // Find user by ID
  static async findById(id) {
    const collection = await this.getCollection();
    return await collection.findOne({ _id: id });
  }

  // Find users by criteria
  static async find(query = {}) {
    const collection = await this.getCollection();
    return await collection.find(query).toArray();
  }

  // Find one user by criteria
  static async findOne(query) {
    const collection = await this.getCollection();
    return await collection.findOne(query);
  }

  // Update user
  static async updateById(id, updateData) {
    const collection = await this.getCollection();
    const updateFields = { ...updateData, updatedAt: new Date() };

    return await collection.findOneAndUpdate(
      { _id: id },
      { $set: updateFields },
      { returnDocument: 'after' }
    );
  }

  // Delete user
  static async deleteById(id) {
    const collection = await this.getCollection();
    return await collection.deleteOne({ _id: id });
  }

  // Find all patients
  static async findPatients(query = {}) {
    return await this.find({ ...query, role: UserRoles.PATIENT });
  }

  // Find all caregivers
  static async findCaregivers(query = {}) {
    return await this.find({ ...query, role: UserRoles.CAREGIVER });
  }

  // Find patients by caregiver
  static async findPatientsByCaregiver(caregiverId) {
    return await this.find({ caregiverId, role: UserRoles.PATIENT });
  }

  // Update or create (upsert)
  static async upsert(query, userData) {
    const collection = await this.getCollection();
    const now = new Date();

    return await collection.findOneAndUpdate(
      query,
      {
        $set: { ...userData, updatedAt: now },
        $setOnInsert: { createdAt: now }
      },
      { upsert: true, returnDocument: 'after' }
    );
  }
}

export default UserModel;
