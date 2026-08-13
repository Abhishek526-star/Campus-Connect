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

describe('API validation (spec §33, §47)', () => {
  it('rejects invalid registration payloads with field-level details', async () => {
    const res = await request(app).post('/api/auth/register').send({
      role: 'student', name: '', email: 'not-an-email', password: 'short',
      rollNumber: '', department: 'Astrology', course: '', year: 99, graduationYear: 1800,
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.length).toBeGreaterThan(0);
    const paths = res.body.error.details.map((d) => d.path);
    expect(paths).toContain('email');
    expect(paths).toContain('department');
  });

  it('rejects invalid login payloads', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'x', password: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects invalid event payloads (bad date, missing title)', async () => {
    await createUser({ email: 'f@test.edu', role: 'faculty' });
    const token = await loginToken('f@test.edu');
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'X', description: 'short', date: 'not-a-date', category: 'nope' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects invalid meeting payloads (end before start)', async () => {
    await createUser({ email: 'a@test.edu', role: 'alumni' });
    const token = await loginToken('a@test.edu');
    const res = await request(app)
      .post('/api/meetings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Meeting', date: new Date().toISOString(), startTime: '18:00', endTime: '17:00',
        type: 'one_on_one', participantIds: [],
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects invalid ratings (out of range)', async () => {
    await createUser({ email: 'f2@test.edu', role: 'faculty' });
    const fToken = await loginToken('f2@test.edu');
    const created = await request(app)
      .post('/api/resources')
      .set('Authorization', `Bearer ${fToken}`)
      .send({ title: 'A Test Resource', category: 'GATE', fileType: 'external', externalUrl: 'https://example.com' });
    const resourceId = created.body.data.resource._id;

    await createUser({ email: 's@test.edu', role: 'student' });
    const sToken = await loginToken('s@test.edu');
    const res = await request(app)
      .post(`/api/resources/${resourceId}/rate`)
      .set('Authorization', `Bearer ${sToken}`)
      .send({ rating: 9 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects malformed JSON with a clean 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": "broken');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it('rejects unknown routes with the standard envelope', async () => {
    await createUser({ email: 's2@test.edu', role: 'student' });
    const token = await loginToken('s2@test.edu');
    const res = await request(app).get('/api/does-not-exist').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
