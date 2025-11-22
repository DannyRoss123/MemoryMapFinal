import { getDb } from '../services/db.js';

/**
 * Memory Model
 * Represents images and videos uploaded for patients
 */

const COLLECTION_NAME = 'memories';

// Memory types
export const MemoryType = {
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO'
};

/**
 * Memory Schema Structure:
 * {
 *   _id: ObjectId,
 *   patientId: ObjectId (required, reference to User),
 *   caregiverId: ObjectId (required, reference to Caregiver),
 *   type: String (IMAGE | VIDEO) (required),
 *   url: String (required, path to file or URL),
 *   title: String,
 *   description: String,
 *   caption: String,
 *   fileSize: Number (in bytes),
 *   mimeType: String,
 *   createdAt: Date,
 *   updatedAt: Date
 * }
 */

class MemoryModel {
  static async getCollection() {
    const db = await getDb();
    return db.collection(COLLECTION_NAME);
  }

  // Create indexes
  static async createIndexes() {
    const collection = await this.getCollection();
    await collection.createIndex({ patientId: 1, createdAt: -1 });
    await collection.createIndex({ caregiverId: 1 });
    await collection.createIndex({ type: 1 });
    await collection.createIndex({ createdAt: -1 });
  }

  // Validation
  static validate(memoryData) {
    const errors = [];

    if (!memoryData.patientId) {
      errors.push('Patient ID is required');
    }

    if (!memoryData.caregiverId) {
      errors.push('Caregiver ID is required');
    }

    if (!memoryData.type || !Object.values(MemoryType).includes(memoryData.type)) {
      errors.push('Type is required and must be either IMAGE or VIDEO');
    }

    if (!memoryData.url || typeof memoryData.url !== 'string' || !memoryData.url.trim()) {
      errors.push('URL is required and must be a non-empty string');
    }

    return errors;
  }

  // Create a new memory
  static async create(memoryData) {
    const errors = this.validate(memoryData);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const collection = await this.getCollection();
    const now = new Date();

    const memory = {
      patientId: memoryData.patientId,
      caregiverId: memoryData.caregiverId,
      type: memoryData.type,
      url: memoryData.url.trim(),
      title: memoryData.title?.trim() || '',
      description: memoryData.description?.trim() || '',
      caption: memoryData.caption?.trim() || '',
      fileSize: memoryData.fileSize || null,
      mimeType: memoryData.mimeType || null,
      createdAt: now,
      updatedAt: now
    };

    const result = await collection.insertOne(memory);
    return await collection.findOne({ _id: result.insertedId });
  }

  // Find memory by ID
  static async findById(id) {
    const collection = await this.getCollection();
    return await collection.findOne({ _id: id });
  }

  // Find memories by criteria
  static async find(query = {}, options = {}) {
    const collection = await this.getCollection();
    const { sort = { createdAt: -1 }, limit, skip } = options;

    let cursor = collection.find(query).sort(sort);

    if (skip) cursor = cursor.skip(skip);
    if (limit) cursor = cursor.limit(limit);

    return await cursor.toArray();
  }

  // Find memories by patient
  static async findByPatient(patientId, options = {}) {
    return await this.find({ patientId }, options);
  }

  // Find memories by caregiver
  static async findByCaregiver(caregiverId, options = {}) {
    return await this.find({ caregiverId }, options);
  }

  // Find memories by type
  static async findByType(type, query = {}, options = {}) {
    return await this.find({ ...query, type }, options);
  }

  // Find images
  static async findImages(query = {}, options = {}) {
    return await this.findByType(MemoryType.IMAGE, query, options);
  }

  // Find videos
  static async findVideos(query = {}, options = {}) {
    return await this.findByType(MemoryType.VIDEO, query, options);
  }

  // Update memory
  static async updateById(id, updateData) {
    const collection = await this.getCollection();
    const updateFields = { ...updateData, updatedAt: new Date() };

    return await collection.findOneAndUpdate(
      { _id: id },
      { $set: updateFields },
      { returnDocument: 'after' }
    );
  }

  // Delete memory
  static async deleteById(id) {
    const collection = await this.getCollection();
    return await collection.deleteOne({ _id: id });
  }

  // Delete all memories for a patient
  static async deleteByPatient(patientId) {
    const collection = await this.getCollection();
    return await collection.deleteMany({ patientId });
  }

  // Count memories
  static async count(query = {}) {
    const collection = await this.getCollection();
    return await collection.countDocuments(query);
  }

  // Count by patient
  static async countByPatient(patientId) {
    return await this.count({ patientId });
  }

  // Count by type
  static async countByType(type, query = {}) {
    return await this.count({ ...query, type });
  }
}

export default MemoryModel;
