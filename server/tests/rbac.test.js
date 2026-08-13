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

describe('RBAC — role authorization matrix (spec §21)', () => {
  it('blocks unauthenticated requests', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('NO_ACCESS_TOKEN');
  });

  it('blocks students from creating events (faculty/alumni only)', async () => {
    await createUser({ email: 's@test.edu', role: 'student' });
    const token = await loginToken('s@test.edu');
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Nope', description: 'Should be blocked by RBAC middleware.', date: new Date().toISOString(), category: 'workshop' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('EVENT_CREATE_FORBIDDEN');
  });

  it('blocks students from posting jobs', async () => {
    await createUser({ email: 's2@test.edu', role: 'student' });
    const token = await loginToken('s2@test.edu');
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Valid Job', company: 'X Corp', description: 'A valid payload that must still be blocked by the RBAC middleware.', type: 'job', workMode: 'remote' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('JOB_POST_FORBIDDEN');
  });

  it('blocks students from uploading resources', async () => {
    await createUser({ email: 's3@test.edu', role: 'student' });
    const token = await loginToken('s3@test.edu');
    const res = await request(app)
      .post('/api/resources')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Nope', category: 'GATE', fileType: 'external', externalUrl: 'https://example.com' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('RESOURCE_UPLOAD_FORBIDDEN');
  });

  it('blocks students from publishing announcements', async () => {
    await createUser({ email: 's4@test.edu', role: 'student' });
    const token = await loginToken('s4@test.edu');
    const res = await request(app)
      .post('/api/announcements')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Fake', body: 'Should be blocked.' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ANNOUNCEMENT_FORBIDDEN');
  });

  it('blocks non-students from applying to scholarships', async () => {
    await createUser({ email: 'sp@test.edu', role: 'alumni' });
    const sponsorToken = await loginToken('sp@test.edu');
    const campaign = await request(app)
      .post('/api/scholarships')
      .set('Authorization', `Bearer ${sponsorToken}`)
      .send({
        name: 'Sponsor Scholarship', description: 'A scholarship that alumni sponsor on the platform.',
        eligibility: 'Any student with genuine financial need is eligible to apply.',
        amount: 10000, targetAmount: 30000, deadline: new Date(Date.now() + 30 * 86400000).toISOString(),
      });

    await createUser({ email: 'a1@test.edu', role: 'alumni' });
    const token = await loginToken('a1@test.edu');
    const res = await request(app)
      .post(`/api/scholarships/${campaign.body.data.scholarship._id}/apply`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rollNumber: 'X-1', department: 'CS', familyIncome: 100, academicPerformance: 80, reason: 'Reason must be ten characters long at least.', documents: [{ url: '/uploads/test/doc.pdf', name: 'doc.pdf', mimeType: 'application/pdf', size: 10 }] });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('STUDENT_ONLY');
  });

  it('blocks non-admins from admin endpoints', async () => {
    await createUser({ email: 'a2@test.edu', role: 'alumni' });
    const token = await loginToken('a2@test.edu');
    for (const path of ['/api/admin/stats', '/api/operations/settings', '/api/operations/audit-logs']) {
      const res = await request(app).get(path).set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    }
  });

  it('allows admins into admin endpoints', async () => {
    await createUser({ email: 'adm@test.edu', role: 'admin' });
    const token = await loginToken('adm@test.edu');
    const res = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('prevents event edits by non-organizers', async () => {
    await createUser({ email: 'f@test.edu', role: 'faculty' });
    const fToken = await loginToken('f@test.edu');
    const created = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${fToken}`)
      .send({ title: 'My Event', description: 'Organizer owns this event for the authorization test.', date: new Date(Date.now() + 86400000).toISOString(), category: 'workshop', maxParticipants: 30 });
    const eventId = created.body.data.event._id;

    await createUser({ email: 's5@test.edu', role: 'student' });
    const sToken = await loginToken('s5@test.edu');
    const res = await request(app)
      .put(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${sToken}`)
      .send({ title: 'Hacked' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('EVENT_UPDATE_FORBIDDEN');
  });
});
