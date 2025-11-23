import { Router } from 'express';
import { ObjectId } from 'mongodb';
import upload from '../middleware/upload.js';
import UserModel from '../models/User.js';
import { getDb } from '../services/db.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const usersRouter = Router();

// GET /api/users/:id - Get user by ID (checks both collections for backwards compatibility)
usersRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const objectId = new ObjectId(id);
    const db = await getDb();
    const caregivers = db.collection('caregivers');
    const users = db.collection('users');

    // First check users collection (preferred)
    let record = await users.findOne({ _id: objectId });

    // Fallback to caregivers collection if not found (for backward compatibility with existing data)
    if (!record) {
      record = await caregivers.findOne({ _id: objectId });
    }

    if (!record) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(record);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /api/users/:id/profile-picture - Upload profile picture
usersRouter.post('/:id/profile-picture', upload.single('profilePicture'), async (req, res) => {
  try {
    const { id } = req.params;

    console.log('Upload profile picture request for user ID:', id);

    if (!ObjectId.isValid(id)) {
      console.log('Invalid ObjectId format:', id);
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file type (images only)
    if (!req.file.mimetype.startsWith('image/')) {
      // Delete uploaded file if not an image
      await fs.unlink(req.file.path);
      return res.status(400).json({ error: 'Only image files are allowed' });
    }

    const objectId = new ObjectId(id);
    const db = await getDb();
    const caregivers = db.collection('caregivers');
    const users = db.collection('users');

    // Check if this is a caregiver or a user
    let caregiver = await caregivers.findOne({ _id: objectId });
    console.log('Found in caregivers collection:', !!caregiver);
    let user = null;
    let isCaregiver = !!caregiver;

    if (!caregiver) {
      // Check users collection
      user = await users.findOne({ _id: objectId });
      console.log('Found in users collection:', !!user);
    }

    if (!caregiver && !user) {
      // Delete uploaded file if neither exists
      console.error('User not found in either collection for ID:', id);
      await fs.unlink(req.file.path);
      return res.status(404).json({ error: 'User not found' });
    }

    const record = caregiver || user;

    // If record already has a profile picture, delete the old file
    if (record.profilePicture) {
      const oldFilePath = path.join(__dirname, '../../', record.profilePicture);
      try {
        await fs.unlink(oldFilePath);
      } catch (error) {
        // Ignore error if file doesn't exist
        console.log('Old profile picture not found or already deleted');
      }
    }

    // Update with new profile picture URL
    const profilePictureUrl = `/uploads/${req.file.filename}`;
    const collection = isCaregiver ? caregivers : users;

    const result = await collection.findOneAndUpdate(
      { _id: objectId },
      { $set: { profilePicture: profilePictureUrl, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile picture uploaded successfully',
      profilePicture: profilePictureUrl,
      user: result.value
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    // Try to delete the uploaded file if there was an error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }
    res.status(500).json({ error: 'Failed to upload profile picture' });
  }
});

// DELETE /api/users/:id/profile-picture - Remove profile picture
usersRouter.delete('/:id/profile-picture', async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const user = await UserModel.findById(new ObjectId(id));

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.profilePicture) {
      return res.status(400).json({ error: 'User does not have a profile picture' });
    }

    // Delete the profile picture file
    const filePath = path.join(__dirname, '../../', user.profilePicture);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.log('Profile picture file not found or already deleted');
    }

    // Update user to remove profile picture
    const result = await UserModel.updateById(new ObjectId(id), {
      profilePicture: null
    });

    if (!result.value) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile picture removed successfully',
      user: result.value
    });
  } catch (error) {
    console.error('Error removing profile picture:', error);
    res.status(500).json({ error: 'Failed to remove profile picture' });
  }
});

// PATCH /api/users/:id - Update user
usersRouter.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    // Don't allow updating certain fields
    delete updateData._id;
    delete updateData.createdAt;

    const result = await UserModel.updateById(new ObjectId(id), updateData);

    if (!result.value) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.value);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});
