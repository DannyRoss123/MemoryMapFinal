import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { Collections } from '../services/db.js';
import { getDb } from '../services/db.js';

export const journalRouter = Router();

// GET /api/journal - Get all journal entries (with optional filters)
// Query params: patientId, startDate, endDate
journalRouter.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const journalEntries = db.collection(Collections.JOURNAL_ENTRIES);

    const query = {};

    // Filter by patientId
    if (req.query.patientId) {
      try {
        query.patientId = new ObjectId(req.query.patientId);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid patientId format' });
      }
    }

    // Filter by date range
    if (req.query.startDate || req.query.endDate) {
      query.date = {};
      if (req.query.startDate) {
        query.date.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.date.$lte = new Date(req.query.endDate);
      }
    }

    const entries = await journalEntries.find(query).sort({ date: -1 }).toArray();
    res.json(entries);
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    res.status(500).json({ error: 'Failed to fetch journal entries' });
  }
});

// GET /api/journal/:id - Get a specific journal entry
journalRouter.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const journalEntries = db.collection(Collections.JOURNAL_ENTRIES);

    const entry = await journalEntries.findOne({ _id: new ObjectId(req.params.id) });

    if (!entry) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    res.json(entry);
  } catch (error) {
    console.error('Error fetching journal entry:', error);
    res.status(500).json({ error: 'Failed to fetch journal entry' });
  }
});

// GET /api/journal/:id/messages - Get chat history for an entry
journalRouter.get('/:id/messages', async (req, res) => {
  try {
    const db = await getDb();
    const journalEntries = db.collection(Collections.JOURNAL_ENTRIES);

    const entry = await journalEntries.findOne(
      { _id: new ObjectId(req.params.id) },
      { projection: { messages: 1 } }
    );

    if (!entry) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    res.json(entry.messages || []);
  } catch (error) {
    console.error('Error fetching journal messages:', error);
    res.status(500).json({ error: 'Failed to fetch journal messages' });
  }
});

// POST /api/journal/:id/chat - Generate a supportive AI response for a journal entry and persist conversation
journalRouter.post('/:id/chat', async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    const db = await getDb();
    const journalEntries = db.collection(Collections.JOURNAL_ENTRIES);
    const entry = await journalEntries.findOne({ _id: new ObjectId(req.params.id) });

    if (!entry) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    const model = req.body.model || process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    const temperature =
      typeof req.body.temperature === 'number'
        ? req.body.temperature
        : parseFloat(process.env.OPENAI_TEMPERATURE || '0.7');

    const clientMessages = Array.isArray(req.body.messages) ? req.body.messages : [];
    const sanitizedMessages = clientMessages
      .filter((m) => m?.role === 'user' || m?.role === 'assistant')
      .map((m) => ({
        role: m.role,
        text: m.text || '',
        createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
      }));

    const chatMessages = [
      {
        role: 'system',
        content:
          'You are a compassionate, concise companion helping someone reflect on their feelings. ' +
          'Acknowledge their entry with warmth, ask gentle follow-up questions, and avoid clinical or diagnostic language. ' +
          'Keep replies brief (1-3 sentences) and supportive.',
      },
      {
        role: 'user',
        content: `Journal entry: ${entry.content}`,
      },
      ...sanitizedMessages.map((m) => ({
        role: m.role,
        content: m.text,
      })),
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: chatMessages,
        temperature: Number.isFinite(temperature) ? temperature : 0.7,
        max_tokens: 220,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('OpenAI error:', response.status, errorText);
      return res.status(500).json({ error: 'Failed to generate AI response' });
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({ error: 'No response generated' });
    }

    const storedMessages = [
      ...sanitizedMessages,
      { role: 'assistant', text: reply, createdAt: new Date() },
    ];

    await journalEntries.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { messages: storedMessages, updatedAt: new Date() } }
    );

    res.json({ reply, messages: storedMessages });
  } catch (error) {
    console.error('Error generating AI response:', error);
    res.status(500).json({ error: 'Failed to generate AI response' });
  }
});

// POST /api/journal - Create a new journal entry
// Body: { patientId, content, title, date }
journalRouter.post('/', async (req, res) => {
  try {
    const { patientId, content, title, date } = req.body;

    // Validation
    if (!patientId || !content || !date) {
      return res.status(400).json({ error: 'Missing required fields: patientId, content, date' });
    }

    const db = await getDb();
    const journalEntries = db.collection(Collections.JOURNAL_ENTRIES);

    const newEntry = {
      patientId: new ObjectId(patientId),
      content: content.trim(),
      title: title?.trim() || '',
      date: new Date(date),
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: []
    };

    const result = await journalEntries.insertOne(newEntry);
    const createdEntry = await journalEntries.findOne({ _id: result.insertedId });

    console.log('✓ New journal entry created:', {
      entryId: result.insertedId.toString(),
      patientId,
      title: newEntry.title || 'Untitled',
      date: newEntry.date.toISOString(),
      contentLength: newEntry.content.length,
      timestamp: new Date().toISOString()
    });

    res.status(201).json(createdEntry);
  } catch (error) {
    console.error('Error creating journal entry:', error);
    res.status(500).json({ error: 'Failed to create journal entry' });
  }
});

// PATCH /api/journal/:id - Update a journal entry
// Body: { content, title, date }
journalRouter.patch('/:id', async (req, res) => {
  try {
    const { content, title, date } = req.body;

    const db = await getDb();
    const journalEntries = db.collection(Collections.JOURNAL_ENTRIES);

    const updateFields = { updatedAt: new Date() };

    if (content !== undefined) updateFields.content = content.trim();
    if (title !== undefined) updateFields.title = title.trim();
    if (date !== undefined) updateFields.date = new Date(date);

    const result = await journalEntries.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error updating journal entry:', error);
    res.status(500).json({ error: 'Failed to update journal entry' });
  }
});

// DELETE /api/journal/:id - Delete a journal entry
journalRouter.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const journalEntries = db.collection(Collections.JOURNAL_ENTRIES);

    const result = await journalEntries.deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    res.json({ message: 'Journal entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    res.status(500).json({ error: 'Failed to delete journal entry' });
  }
});
