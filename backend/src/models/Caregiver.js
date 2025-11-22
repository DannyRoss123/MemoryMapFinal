import { getDb } from '../services/db.js';

/**
 * Caregiver Model
 * Represents caregivers with extended information
 */

const COLLECTION_NAME = 'caregivers';

/**
 * Caregiver Schema Structure:
 * {
 *   _id: ObjectId,
 *   name: String (required, unique),
 *   email: String (optional, unique),
 *   location: String (required),
 *   profileImage: String (URL or path),
 *   phone: String (optional),
 *   specialty: String (optional),
 *   createdAt: Date,
 *   updatedAt: Date
 * }
 */

class CaregiverModel {
  static async getCollection() {
    const db = await getDb();
    return db.collection(COLLECTION_NAME);
  }

  // Create indexes
  static async createIndexes() {
    const collection = await this.getCollection();
    await collection.createIndex({ name: 1 }, { unique: true });
    await collection.createIndex({ email: 1 }, { unique: true, sparse: true });
  }

  // Validation
  static validate(caregiverData) {
    const errors = [];

    if (!caregiverData.name || typeof caregiverData.name !== 'string' || !caregiverData.name.trim()) {
      errors.push('Name is required and must be a non-empty string');
    }

    if (!caregiverData.location || typeof caregiverData.location !== 'string' || !caregiverData.location.trim()) {
      errors.push('Location is required and must be a non-empty string');
    }

    if (caregiverData.email && typeof caregiverData.email !== 'string') {
      errors.push('Email must be a string');
    }

    return errors;
  }

  // Create a new caregiver
  static async create(caregiverData) {
    const errors = this.validate(caregiverData);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const collection = await this.getCollection();
    const now = new Date();

    const caregiver = {
      name: caregiverData.name.trim(),
      email: caregiverData.email?.trim() || null,
      location: caregiverData.location.trim(),
      profileImage: caregiverData.profileImage || null,
      phone: caregiverData.phone?.trim() || null,
      specialty: caregiverData.specialty?.trim() || null,
      createdAt: now,
      updatedAt: now
    };

    const result = await collection.insertOne(caregiver);
    return await collection.findOne({ _id: result.insertedId });
  }

  // Find caregiver by ID
  static async findById(id) {
    const collection = await this.getCollection();
    return await collection.findOne({ _id: id });
  }

  // Find caregiver by name
  static async findByName(name) {
    const collection = await this.getCollection();
    return await collection.findOne({ name: name.trim() });
  }

  // Find caregiver by name (case-insensitive)
  static async findByNameCaseInsensitive(name) {
    const collection = await this.getCollection();
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return await collection.findOne({
      name: { $regex: `^${escapedName}$`, $options: 'i' }
    });
  }

  // Find caregivers by criteria
  static async find(query = {}) {
    const collection = await this.getCollection();
    return await collection.find(query).toArray();
  }

  // Find all caregivers
  static async findAll() {
    return await this.find({});
  }

  // Update caregiver
  static async updateById(id, updateData) {
    const collection = await this.getCollection();
    const updateFields = { ...updateData, updatedAt: new Date() };

    return await collection.findOneAndUpdate(
      { _id: id },
      { $set: updateFields },
      { returnDocument: 'after' }
    );
  }

  // Delete caregiver
  static async deleteById(id) {
    const collection = await this.getCollection();
    return await collection.deleteOne({ _id: id });
  }

  // Check if caregiver exists by name
  static async existsByName(name) {
    const collection = await this.getCollection();
    const count = await collection.countDocuments({ name: name.trim() });
    return count > 0;
  }

  // Update or create (upsert)
  static async upsert(query, caregiverData) {
    const collection = await this.getCollection();
    const now = new Date();

    return await collection.findOneAndUpdate(
      query,
      {
        $set: { ...caregiverData, updatedAt: now },
        $setOnInsert: { createdAt: now }
      },
      { upsert: true, returnDocument: 'after' }
    );
  }

  // Count caregivers
  static async count(query = {}) {
    const collection = await this.getCollection();
    return await collection.countDocuments(query);
  }
}

export default CaregiverModel;
