import { Router } from 'express';
import bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';
import { getDb } from '../services/db.js';

const roles = ['PATIENT', 'CAREGIVER', 'ADMIN'];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildCaseInsensitiveQuery(name) {
  return { name: { $regex: `^${escapeRegex(name)}$`, $options: 'i' } };
}

export const loginRouter = Router();

loginRouter.post('/', async (req, res) => {
  // Check if this is email/password login (new system) or name-based login (old system)
  const email = req.body?.email?.trim();
  const password = req.body?.password;
  const name = req.body?.name?.trim();
  const role = req.body?.role;
  const location = req.body?.location?.trim();
  const caregiverName = req.body?.caregiverName?.trim();

  // Email/password login (new system for all roles including ADMIN)
  if (email && password) {
    try {
      const db = await getDb();
      const users = db.collection('users');

      // Find user by email
      const user = await users.findOne({ email: email.toLowerCase() });

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Return user data
      return res.json({
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
        caregiverId: user.caregiverId ? user.caregiverId.toString() : undefined,
        caregiverName: user.caregiverName
      });
    } catch (error) {
      console.error('Email/password login error:', error);
      return res.status(500).json({ error: 'Unable to log in' });
    }
  }

  // Name-based login (old system for PATIENT and CAREGIVER)
  if (!name || !role || !['PATIENT', 'CAREGIVER'].includes(role) || !location) {
    return res.status(400).json({ error: 'Invalid name, role, or location' });
  }

  try {
    const db = await getDb();
    const caregivers = db.collection('caregivers');
    const users = db.collection('users');

    if (role === 'CAREGIVER') {
      const existingCaregiver = await caregivers.findOne(buildCaseInsensitiveQuery(name));
      const caregiverId =
        existingCaregiver?._id ??
        (
          await caregivers.insertOne({
            name,
            location,
            createdAt: new Date(),
            updatedAt: new Date()
          })
        ).insertedId;

      await users.updateOne(
        { role, caregiverId },
        {
          $set: { name, role, caregiverId, location, updatedAt: new Date() },
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      );

      return res.json({ userId: caregiverId.toString(), name, role, location });
    }

    const caregiverRecord = caregiverName ? await caregivers.findOne(buildCaseInsensitiveQuery(caregiverName)) : null;
    const caregiverId = caregiverRecord?._id;
    const userRecord = await users.findOne({ ...buildCaseInsensitiveQuery(name), role: 'PATIENT' });

    const patientId =
      userRecord?._id ??
      (
        await users.insertOne({
          name,
          role,
          location,
          caregiverId,
          caregiverName: caregiverRecord?.name,
          createdAt: new Date()
        })
      ).insertedId;

    await users.updateOne(
      { _id: patientId },
      {
        $set: {
          caregiverId,
          caregiverName: caregiverRecord?.name,
          role,
          name,
          location,
          updatedAt: new Date()
        }
      }
    );

    return res.json({
      userId: patientId.toString(),
      name,
      role,
      location,
      caregiverId: caregiverId instanceof ObjectId ? caregiverId.toString() : caregiverId?.toString(),
      caregiverName: caregiverRecord?.name
    });
  } catch (error) {
    console.error('Login error', error);
    return res.status(500).json({ error: 'Unable to log in' });
  }
});
