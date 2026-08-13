import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app, clearDB, connectTestDB, disconnectTestDB, createUser, loginToken } from './helpers.js';

beforeAll(async () => {
  await connectTestDB();
});
afterAll(async () => {
  await disconnectTestDB();
});
beforeEach(async () => {
  await clearDB();
});

describe('Auth — register / verify / login / refresh / logout (spec §3, §42)', () => {
  it('registers a student (auto-approve path) and rejects duplicate emails', async () => {
    const res = await request(app).post('/api/auth/register').send({
      role: 'student', name: 'New Student', email: 'new.student@test.edu', password: 'Test@12345',
      rollNumber: 'CSE-001', department: 'Computer Science', course: 'B.Tech', year: 2, graduationYear: 2027,
    });
    expect(res.status).toBe(201);
    expect(res.body.data.requiresApproval).toBe(false);

    const dup = await request(app).post('/api/auth/register').send({
      role: 'student', name: 'New Student', email: 'new.student@test.edu', password: 'Test@12345',
      rollNumber: 'CSE-001', department: 'Computer Science', course: 'B.Tech', year: 2, graduationYear: 2027,
    });
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe('EMAIL_IN_USE');
  });

  it('registers faculty as pending approval and blocks login until approved', async () => {
    const res = await request(app).post('/api/auth/register').send({
      role: 'faculty', name: 'New Faculty', email: 'new.faculty@test.edu', password: 'Test@12345',
      employeeId: 'FAC-1', department: 'Computer Science', designation: 'Professor',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.requiresApproval).toBe(true);

    // Simulate email verification (token is stored hashed — the email link flow is covered live).
    const User = (await import('../models/user.js')).default;
    await User.updateOne({ email: 'new.faculty@test.edu' }, { $set: { isVerified: true } });

    const blocked = await request(app).post('/api/auth/login').send({ email: 'new.faculty@test.edu', password: 'Test@12345' });
    expect(blocked.status).toBe(401);
    expect(blocked.body.error.code).toBe('ACCOUNT_PENDING_APPROVAL');

    await User.updateOne({ email: 'new.faculty@test.edu' }, { $set: { isApproved: true } });
    const ok = await request(app).post('/api/auth/login').send({ email: 'new.faculty@test.edu', password: 'Test@12345' });
    expect(ok.status).toBe(200);
    expect(ok.body.data.user.role).toBe('faculty');
  });

  it('rejects invalid credentials and wrong-password logins', async () => {
    await createUser({ email: 'a@test.edu' });
    const bad = await request(app).post('/api/auth/login').send({ email: 'a@test.edu', password: 'WrongPass1' });
    expect(bad.status).toBe(401);
    expect(bad.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('rotates refresh tokens and rejects revoked tokens after logout', async () => {
    await createUser({ email: 'r@test.edu' });
    const agent = request.agent(app);

    await agent.post('/api/auth/login').send({ email: 'r@test.edu', password: 'Test@12345' });
    const fresh = await agent.post('/api/auth/refresh');
    expect(fresh.status).toBe(200);
    expect(fresh.body.data.accessToken).toBeTruthy();

    const out = await agent.post('/api/auth/logout');
    expect(out.status).toBe(200);

    const reused = await agent.post('/api/auth/refresh');
    expect(reused.status).toBe(401);
  });

  it('forgot/reset password flow — resets and revokes old credentials', async () => {
    await createUser({ email: 'p@test.edu', password: 'Old@12345' });

    const forgot = await request(app).post('/api/auth/forgot-password').send({ email: 'p@test.edu' });
    expect(forgot.status).toBe(200);

    // Simulate the emailed token: set a known hash via the service path.
    const User = (await import('../models/user.js')).default;
    const user = await User.findOne({ email: 'p@test.edu' });
    // Give the user a reset token we can read: create one directly with a known token.
    const { generateRandomToken, hashToken } = await import('../utils/tokens.js');
    const token = generateRandomToken(16);
    user.resetTokenHash = hashToken(token);
    user.resetTokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    const bad = await request(app).post('/api/auth/reset-password').send({ token: 'bogus-token-123456', password: 'New@12345' });
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('INVALID_RESET_TOKEN');

    const good = await request(app).post('/api/auth/reset-password').send({ token, password: 'New@12345' });
    expect(good.status).toBe(200);

    const oldLogin = await request(app).post('/api/auth/login').send({ email: 'p@test.edu', password: 'Old@12345' });
    expect(oldLogin.status).toBe(401);
    const newLogin = await request(app).post('/api/auth/login').send({ email: 'p@test.edu', password: 'New@12345' });
    expect(newLogin.status).toBe(200);
  });

  it('change-password requires the correct current password', async () => {
    await createUser({ email: 'c@test.edu', password: 'Current@123' });
    const token = await loginToken('c@test.edu', 'Current@123');

    const wrong = await request(app)
      .patch('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'Nope@123', newPassword: 'Changed@123' });
    expect(wrong.status).toBe(400);
    expect(wrong.body.error.code).toBe('WRONG_CURRENT_PASSWORD');

    const ok = await request(app)
      .patch('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'Current@123', newPassword: 'Changed@123' });
    expect(ok.status).toBe(200);
  });
});
