import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app, clearDB, connectTestDB, disconnectTestDB, createUser } from './helpers.js';
import User from '../models/user.js';

// Stub the Google ID-token verifier — test payloads are returned as configured.
const payloads = [];
vi.mock('google-auth-library', () => ({
  OAuth2Client: class {
    async verifyIdToken() {
      const payload = payloads[0] ?? {
        sub: 'google-sub-1',
        email: 'new.google@test.edu',
        email_verified: true,
        name: 'Google User',
        picture: 'https://example.com/pic.png',
      };
      if (payload === 'THROW') throw new Error('invalid token');
      return { getPayload: () => payload };
    }
  },
}));

beforeAll(async () => {
  await connectTestDB();
});
afterAll(async () => {
  await disconnectTestDB();
});
beforeEach(async () => {
  await clearDB();
  payloads.length = 0;
});

const googleLogin = () =>
  request(app).post('/api/auth/google').send({ credential: 'fake-google-id-token' });

describe('Google (Gmail) direct login (spec §3)', () => {
  it('creates a verified student account on first sign-in', async () => {
    const res = await googleLogin();
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.user.email).toBe('new.google@test.edu');
    expect(res.body.data.user.role).toBe('student');

    const user = await User.findOne({ email: 'new.google@test.edu' });
    expect(user).toBeTruthy();
    expect(user.isVerified).toBe(true);
    expect(user.isApproved).toBe(true);
    expect(user.googleId).toBe('google-sub-1');
    expect(user.passwordHash).toBeFalsy(); // passwordless account
    expect(res.body.data.user.profileCompleted).toBe(false); // no placeholder profile
  });

  it('completes the student profile via upsert after Google signup', async () => {
    const signup = await googleLogin();
    const token = signup.body.data.accessToken;
    const res = await request(app)
      .patch('/api/users/me/role-profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ rollNumber: 'CS-2026-001', department: 'Computer Science', course: 'B.Tech', year: 3, graduationYear: 2029 });
    expect(res.status).toBe(200);
    expect(res.body.data.profile.rollNumber).toBe('CS-2026-001');

    const me = await request(app).get('/api/users/me').set('Authorization', `Bearer ${token}`);
    expect(me.body.data.profile.rollNumber).toBe('CS-2026-001');
  });

  it('logs in an existing account matched by email (no duplicate)', async () => {
    await createUser({ email: 'existing@test.edu', role: 'student', extra: { googleId: 'google-sub-9' } });
    payloads.push({ sub: 'google-sub-9', email: 'existing@test.edu', email_verified: true, name: 'Existing' });

    const res = await googleLogin();
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('existing@test.edu');

    const count = await User.countDocuments({ email: 'existing@test.edu' });
    expect(count).toBe(1);
  });

  it('respects admin approval for faculty accounts', async () => {
    await createUser({ email: 'faculty.g@test.edu', role: 'faculty', approved: false, verified: true });
    payloads.push({ sub: 'google-sub-f', email: 'faculty.g@test.edu', email_verified: true, name: 'F' });

    const res = await googleLogin();
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('ACCOUNT_PENDING_APPROVAL');
  });

  it('rejects an invalid ID token', async () => {
    payloads.push('THROW');
    const res = await googleLogin();
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_GOOGLE_TOKEN');
  });

  it('rejects unverified Google emails', async () => {
    payloads.push({ sub: 'google-sub-2', email: 'unverified@test.edu', email_verified: false, name: 'U' });
    const res = await googleLogin();
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('GOOGLE_EMAIL_UNVERIFIED');
  });
});
