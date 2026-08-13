import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app, clearDB, connectTestDB, disconnectTestDB, createUser, createUserWithProfile, loginToken } from './helpers.js';

beforeAll(async () => {
  await connectTestDB();
});
afterAll(async () => {
  await disconnectTestDB();
});
beforeEach(async () => {
  await clearDB();
});

describe('Individual member report PDF (admin/faculty/alumni)', () => {
  it('downloads a member report as admin with real profile data', async () => {
    await createUserWithProfile({ email: 'target@test.edu', role: 'student', name: 'Target Student' });
    await createUser({ email: 'admin@test.edu', role: 'admin' });
    const token = await loginToken('admin@test.edu');

    const user = await mongoose.connection.db.collection('users').findOne({ email: 'target@test.edu' });
    const res = await request(app)
      .get(`/api/reports/member/${user._id.toString()}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.headers['content-disposition']).toContain('member-report-target-student-');
    expect(res.body.toString('latin1', 0, 5)).toBe('%PDF-'); // valid PDF
    expect(res.body.length).toBeGreaterThan(1500);
  });

  it('allows faculty and alumni viewers', async () => {
    await createUserWithProfile({ email: 'target2@test.edu', role: 'student', name: 'Second Target' });
    await createUser({ email: 'fac@test.edu', role: 'faculty' });
    await createUser({ email: 'alu@test.edu', role: 'alumni' });
    const target = await mongoose.connection.db.collection('users').findOne({ email: 'target2@test.edu' });
    const url = `/api/reports/member/${target._id.toString()}`;

    for (const account of ['fac@test.edu', 'alu@test.edu']) {
      const token = await loginToken(account);
      const res = await request(app).get(url).set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    }
  });

  it('blocks students', async () => {
    await createUserWithProfile({ email: 'target3@test.edu', role: 'student', name: 'Third' });
    await createUser({ email: 'stu@test.edu', role: 'student' });
    const target = await mongoose.connection.db.collection('users').findOne({ email: 'target3@test.edu' });
    const token = await loginToken('stu@test.edu');

    const res = await request(app)
      .get(`/api/reports/member/${target._id.toString()}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('REPORT_FORBIDDEN');
  });

  it('returns 404 for an unknown member', async () => {
    await createUser({ email: 'admin2@test.edu', role: 'admin' });
    const token = await loginToken('admin2@test.edu');

    const res = await request(app)
      .get(`/api/reports/member/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
