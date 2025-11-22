import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { Collections } from '../services/db.js';
import { getDb } from '../services/db.js';

export const contactsRouter = Router();

// GET /api/contacts - Get all contacts (with optional patientId filter)
// Query params: patientId
contactsRouter.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const contacts = db.collection(Collections.CONTACTS);

    const query = {};

    // Filter by patientId
    if (req.query.patientId) {
      try {
        query.patientId = new ObjectId(req.query.patientId);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid patientId format' });
      }
    }

    const contactsList = await contacts.find(query).sort({ createdAt: -1 }).toArray();
    res.json(contactsList);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// GET /api/contacts/patient/:patientId - Get all contacts for a patient
contactsRouter.get('/patient/:patientId', async (req, res) => {
  try {
    const db = await getDb();
    const contacts = db.collection(Collections.CONTACTS);

    let patientObjectId;
    try {
      patientObjectId = new ObjectId(req.params.patientId);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid patientId format' });
    }

    const contactsList = await contacts
      .find({ patientId: patientObjectId })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(contactsList);
  } catch (error) {
    console.error('Error fetching patient contacts:', error);
    res.status(500).json({ error: 'Failed to fetch patient contacts' });
  }
});

// GET /api/contacts/:id - Get a specific contact
contactsRouter.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const contacts = db.collection(Collections.CONTACTS);

    const contact = await contacts.findOne({ _id: new ObjectId(req.params.id) });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(contact);
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
});

// POST /api/contacts - Create a new contact
// Body: { patientId, firstName, lastName, middleName?, email?, phoneNumber?, profilePicture?, relationship }
contactsRouter.post('/', async (req, res) => {
  try {
    const { patientId, firstName, lastName, middleName, email, phoneNumber, profilePicture, relationship } = req.body;

    // Validation
    if (!patientId || !firstName || !lastName || !relationship) {
      return res.status(400).json({
        error: 'Missing required fields: patientId, firstName, lastName, relationship'
      });
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const db = await getDb();
    const contacts = db.collection(Collections.CONTACTS);

    const newContact = {
      patientId: new ObjectId(patientId),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      middleName: middleName?.trim() || '',
      email: email?.trim() || '',
      phoneNumber: phoneNumber?.trim() || '',
      profilePicture: profilePicture?.trim() || '',
      relationship: relationship.trim(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await contacts.insertOne(newContact);
    const createdContact = await contacts.findOne({ _id: result.insertedId });

    console.log('✓ New contact created:', {
      contactId: result.insertedId.toString(),
      patientId,
      name: `${newContact.firstName} ${newContact.lastName}`,
      relationship: newContact.relationship,
      timestamp: new Date().toISOString()
    });

    res.status(201).json(createdContact);
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

// PATCH /api/contacts/:id - Update a contact
// Body: { firstName?, lastName?, middleName?, email?, phoneNumber?, profilePicture?, relationship? }
contactsRouter.patch('/:id', async (req, res) => {
  try {
    const { firstName, lastName, middleName, email, phoneNumber, profilePicture, relationship } = req.body;

    const db = await getDb();
    const contacts = db.collection(Collections.CONTACTS);

    const updateFields = { updatedAt: new Date() };

    if (firstName !== undefined) {
      updateFields.firstName = firstName.trim();
    }
    if (lastName !== undefined) {
      updateFields.lastName = lastName.trim();
    }
    if (middleName !== undefined) {
      updateFields.middleName = middleName.trim();
    }
    if (email !== undefined) {
      // Validate email format if provided
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
      updateFields.email = email.trim();
    }
    if (phoneNumber !== undefined) {
      updateFields.phoneNumber = phoneNumber.trim();
    }
    if (profilePicture !== undefined) {
      updateFields.profilePicture = profilePicture.trim();
    }
    if (relationship !== undefined) {
      updateFields.relationship = relationship.trim();
    }

    const result = await contacts.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    console.log('✓ Contact updated:', {
      contactId: req.params.id,
      updatedFields: Object.keys(updateFields).filter(key => key !== 'updatedAt'),
      timestamp: new Date().toISOString()
    });

    res.json(result);
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

// DELETE /api/contacts/:id - Delete a contact
contactsRouter.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const contacts = db.collection(Collections.CONTACTS);

    const result = await contacts.deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    console.log('✓ Contact deleted:', {
      contactId: req.params.id,
      timestamp: new Date().toISOString()
    });

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});
