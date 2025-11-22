import { Router } from 'express';
import bcrypt from 'bcrypt';
import { getDb } from '../services/db.js';

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email?.trim()) {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  try {
    const db = await getDb();
    const users = db.collection('users');

    // Find user by email
    const normalizedEmail = email.trim().toLowerCase();
    const user = await users.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Get caregiver info if patient
    let caregiverId = user.caregiverId;
    let caregiverName = user.caregiverName;

    if (user.role === 'PATIENT' && user.caregiverId) {
      const caregivers = db.collection('caregivers');
      const caregiver = await caregivers.findOne({ userId: user.caregiverId });
      if (caregiver) {
        caregiverName = caregiver.name;
      }
    }

    // Return user data (excluding password)
    const userData = {
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      location: user.location,
      caregiverId: caregiverId?.toString(),
      caregiverName
    };

    console.log('✓ User logged in:', {
      userId: userData.userId,
      email: userData.email,
      role: userData.role,
      timestamp: new Date().toISOString()
    });

    return res.json(userData);
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Unable to log in' });
  }
});
