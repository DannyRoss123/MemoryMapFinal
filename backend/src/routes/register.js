import { Router } from 'express';
import bcrypt from 'bcrypt';
import { getDb } from '../services/db.js';

const SALT_ROUNDS = 10;
const roles = ['PATIENT', 'CAREGIVER'];

export const registerRouter = Router();

registerRouter.post('/', async (req, res) => {
  const { firstName, lastName, email, password, role, location } = req.body;

  // Validation
  if (!firstName?.trim() || !lastName?.trim()) {
    return res.status(400).json({ error: 'First name and last name are required' });
  }

  if (!email?.trim()) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  if (!role || !roles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  if (!location?.trim()) {
    return res.status(400).json({ error: 'Location is required' });
  }

  try {
    const db = await getDb();
    const users = db.collection('users');

    // Check if user already exists
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await users.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const name = `${firstName.trim()} ${lastName.trim()}`;
    const result = await users.insertOne({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      location: location.trim(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✓ New user registered:', {
      userId: result.insertedId.toString(),
      name,
      email: normalizedEmail,
      role,
      location: location.trim(),
      timestamp: new Date().toISOString()
    });

    // If caregiver, also create caregiver record with the same _id
    if (role === 'CAREGIVER') {
      const caregivers = db.collection('caregivers');
      await caregivers.insertOne({
        _id: result.insertedId, // Use same ID as user
        name,
        location: location.trim(),
        patients: [], // Initialize empty patients array
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log('✓ Caregiver record created:', {
        caregiverId: result.insertedId.toString(),
        name,
        location: location.trim(),
        timestamp: new Date().toISOString()
      });
    }

    return res.status(201).json({
      message: 'Registration successful',
      userId: result.insertedId.toString(),
      role,
      name
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Unable to register. Please try again.' });
  }
});
