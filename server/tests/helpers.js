import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import app from '../app.js';
import { reconcileIndexes } from '../config/db.js';
import User from '../models/user.js';
import StudentProfile from '../models/studentProfile.js';
import FacultyProfile from '../models/facultyProfile.js';
import AlumniProfile from '../models/alumniProfile.js';

/**
 * Safety guard: tests must ONLY ever run against a dedicated test database.
 * Without this, a misconfigured MONGO_URI would let clearDB() wipe real data.
 */
export function assertTestDatabase() {
  const name = mongoose.connection.name ?? '';
  if (!name.endsWith('_test')) {
    throw new Error(
      `Refusing to run tests against database "${name}" — the connection must point at a *_test database. ` +
        'Check MONGO_URI in server/tests/setup.js.',
    );
  }
}

/** Connect to the dedicated test database. */
export async function connectTestDB() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  assertTestDatabase();
  await reconcileIndexes();
}

/** Wipe all collections (called between test files). */
export async function clearDB() {
  if (mongoose.connection.readyState !== 1) await connectTestDB();
  assertTestDatabase();
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}

export async function disconnectTestDB() {
  await mongoose.disconnect();
}

/** Create a user directly (fast path; auth flows tested separately). */
export async function createUser({
  name = 'Test User',
  email,
  role = 'student',
  password = 'Test@12345',
  verified = true,
  approved = true,
  extra = {},
}) {
  const user = await User.create({
    name,
    email: email ?? `${role}-${Math.random().toString(36).slice(2, 10)}@test.edu`,
    passwordHash: await bcrypt.hash(password, 4),
    role,
    isVerified: verified,
    isApproved: approved,
    ...extra,
  });
  return user;
}

/** Create a user with their role profile. */
export async function createUserWithProfile({ email, role = 'student', name = 'Profile User' }) {
  const user = await createUser({ email, role, name });
  if (role === 'student') {
    await StudentProfile.create({ user: user._id, rollNumber: 'T-001', department: 'Computer Science', course: 'B.Tech', year: 3, graduationYear: 2027 });
  } else if (role === 'faculty') {
    await FacultyProfile.create({ user: user._id, employeeId: 'T-1001', department: 'Computer Science', designation: 'Professor' });
  } else if (role === 'alumni') {
    await AlumniProfile.create({ user: user._id, graduationYear: 2020, department: 'Computer Science', degree: 'B.Tech', currentCompany: 'TestCorp', designation: 'Engineer' });
  }
  return user;
}

/** Login and return the access token. */
export async function loginToken(email, password = 'Test@12345') {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  if (!res.body.success) throw new Error(`login failed: ${res.body.message}`);
  return res.body.data.accessToken;
}

export { app, request, mongoose, User };
