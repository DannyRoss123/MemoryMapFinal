import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const roles = ['PATIENT', 'CAREGIVER'] as const;
type Role = (typeof roles)[number];

type LoginPayload = {
  name?: string;
  role?: Role;
  location?: string;
  caregiverName?: string;
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildCaseInsensitiveQuery(name: string) {
  return { name: { $regex: `^${escapeRegex(name)}$`, $options: 'i' } };
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as LoginPayload;
  const name = body.name?.trim();
  const role = body.role;
  const location = body.location?.trim();
  const caregiverName = body.caregiverName?.trim();

  if (!name || !role || !roles.includes(role) || !location) {
    return NextResponse.json({ error: 'Invalid name, role, or location' }, { status: 400 });
  }

  try {
    const db = await getDb();
    const caregivers = db.collection('caregivers');
    const users = db.collection('users');

    if (role === 'CAREGIVER') {
      const existingCaregiver = await caregivers.findOne(buildCaseInsensitiveQuery(name));
      const caregiverId =
        existingCaregiver?._id ??
        (await caregivers.insertOne({ name, location, createdAt: new Date(), updatedAt: new Date() })).insertedId;

      await users.updateOne(
        { role, caregiverId },
        {
          $set: { name, role, caregiverId, location, updatedAt: new Date() },
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      );

      return NextResponse.json({ userId: caregiverId.toString(), name, role, location });
    }

    const caregiverRecord = caregiverName ? await caregivers.findOne(buildCaseInsensitiveQuery(caregiverName)) : null;
    const caregiverId = caregiverRecord?._id as ObjectId | undefined;
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

    // keep pairing info up to date
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

    return NextResponse.json({
      userId: patientId.toString(),
      name,
      role,
      location,
      caregiverId: caregiverId?.toString(),
      caregiverName: caregiverRecord?.name
    });
  } catch (error) {
    console.error('Login error', error);
    return NextResponse.json({ error: 'Unable to log in' }, { status: 500 });
  }
}
