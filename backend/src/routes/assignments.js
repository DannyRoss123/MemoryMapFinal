import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { Collections } from '../services/db.js';
import { getDb } from '../services/db.js';

export const assignmentsRouter = Router();

/**
 * POST /api/assignments/assign
 * Assign a patient to a caregiver
 * Body: { patientId, caregiverId }
 */
assignmentsRouter.post('/assign', async (req, res) => {
  try {
    const { patientId, caregiverId } = req.body;

    // Validation
    if (!patientId || !caregiverId) {
      return res.status(400).json({ error: 'Missing required fields: patientId, caregiverId' });
    }

    const db = await getDb();
    const users = db.collection(Collections.USERS);
    const caregivers = db.collection(Collections.CAREGIVERS);

    const patientObjectId = new ObjectId(patientId);
    const caregiverObjectId = new ObjectId(caregiverId);

    // Verify patient exists
    const patient = await users.findOne({ _id: patientObjectId, role: 'PATIENT' });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Verify caregiver exists
    const caregiver = await caregivers.findOne({ _id: caregiverObjectId });
    if (!caregiver) {
      return res.status(404).json({ error: 'Caregiver not found' });
    }

    // Check if patient is already assigned to this caregiver
    if (patient.caregiverId && patient.caregiverId.toString() === caregiverId) {
      return res.status(400).json({ error: 'Patient is already assigned to this caregiver' });
    }

    // If patient has a previous caregiver, remove patient from their list
    if (patient.caregiverId) {
      await caregivers.updateOne(
        { _id: patient.caregiverId },
        {
          $pull: { patients: patientObjectId },
          $set: { updatedAt: new Date() }
        }
      );
    }

    // Update patient with new caregiver
    await users.updateOne(
      { _id: patientObjectId },
      {
        $set: {
          caregiverId: caregiverObjectId,
          caregiverName: caregiver.name,
          updatedAt: new Date()
        }
      }
    );

    // Add patient to caregiver's patients array (if not already there)
    await caregivers.updateOne(
      { _id: caregiverObjectId },
      {
        $addToSet: { patients: patientObjectId },
        $set: { updatedAt: new Date() }
      }
    );

    console.log(`✅ Patient ${patientId} assigned to caregiver ${caregiverId}`);

    // Return updated patient
    const updatedPatient = await users.findOne({ _id: patientObjectId });
    res.json(updatedPatient);
  } catch (error) {
    console.error('Error assigning patient to caregiver:', error);
    res.status(500).json({ error: 'Failed to assign patient to caregiver' });
  }
});

/**
 * POST /api/assignments/unassign
 * Unassign a patient from their caregiver
 * Body: { patientId }
 */
assignmentsRouter.post('/unassign', async (req, res) => {
  try {
    const { patientId } = req.body;

    // Validation
    if (!patientId) {
      return res.status(400).json({ error: 'Missing required field: patientId' });
    }

    const db = await getDb();
    const users = db.collection(Collections.USERS);
    const caregivers = db.collection(Collections.CAREGIVERS);

    const patientObjectId = new ObjectId(patientId);

    // Get patient
    const patient = await users.findOne({ _id: patientObjectId, role: 'PATIENT' });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (!patient.caregiverId) {
      return res.status(400).json({ error: 'Patient is not assigned to any caregiver' });
    }

    // Remove patient from caregiver's patients array
    await caregivers.updateOne(
      { _id: patient.caregiverId },
      {
        $pull: { patients: patientObjectId },
        $set: { updatedAt: new Date() }
      }
    );

    // Update patient to remove caregiver
    await users.updateOne(
      { _id: patientObjectId },
      {
        $set: {
          caregiverId: null,
          caregiverName: null,
          updatedAt: new Date()
        }
      }
    );

    console.log(`✅ Patient ${patientId} unassigned from caregiver`);

    // Return updated patient
    const updatedPatient = await users.findOne({ _id: patientObjectId });
    res.json(updatedPatient);
  } catch (error) {
    console.error('Error unassigning patient from caregiver:', error);
    res.status(500).json({ error: 'Failed to unassign patient from caregiver' });
  }
});

/**
 * GET /api/assignments/patient/:patientId/caregiver
 * Get the caregiver assigned to a patient
 */
assignmentsRouter.get('/patient/:patientId/caregiver', async (req, res) => {
  try {
    const db = await getDb();
    const users = db.collection(Collections.USERS);
    const caregivers = db.collection(Collections.CAREGIVERS);

    const patientObjectId = new ObjectId(req.params.patientId);

    // Get patient
    const patient = await users.findOne({ _id: patientObjectId, role: 'PATIENT' });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (!patient.caregiverId) {
      return res.json(null);
    }

    // Get caregiver
    const caregiver = await caregivers.findOne({ _id: patient.caregiverId });
    res.json(caregiver);
  } catch (error) {
    console.error('Error fetching patient caregiver:', error);
    res.status(500).json({ error: 'Failed to fetch patient caregiver' });
  }
});

/**
 * GET /api/assignments/caregiver/:caregiverId/patients
 * Get all patients assigned to a caregiver
 */
assignmentsRouter.get('/caregiver/:caregiverId/patients', async (req, res) => {
  try {
    const db = await getDb();
    const users = db.collection(Collections.USERS);
    const caregivers = db.collection(Collections.CAREGIVERS);

    const caregiverObjectId = new ObjectId(req.params.caregiverId);

    // Verify caregiver exists
    const caregiver = await caregivers.findOne({ _id: caregiverObjectId });
    if (!caregiver) {
      return res.status(404).json({ error: 'Caregiver not found' });
    }

    // Get all patients assigned to this caregiver
    const patients = await users
      .find({
        caregiverId: caregiverObjectId,
        role: 'PATIENT'
      })
      .sort({ name: 1 })
      .toArray();

    res.json(patients);
  } catch (error) {
    console.error('Error fetching caregiver patients:', error);
    res.status(500).json({ error: 'Failed to fetch caregiver patients' });
  }
});
