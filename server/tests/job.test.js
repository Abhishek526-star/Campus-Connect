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

describe('Jobs & internships (spec §14)', () => {
  it('post → save → apply (platform) → duplicate blocked → external apply returns link', async () => {
    await createUser({ email: 'a@test.edu', role: 'alumni' });
    const aToken = await loginToken('a@test.edu');
    await createUser({ email: 's@test.edu', role: 'student' });
    const sToken = await loginToken('s@test.edu');

    const created = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${aToken}`)
      .send({
        title: 'Backend Intern', company: 'TestCorp', type: 'internship',
        description: 'Backend internship with real product work for the automated test suite.',
        location: 'Remote', workMode: 'remote', salary: '₹30k', skills: ['Node.js'], applyThroughPlatform: true,
      });
    expect(created.status).toBe(201);
    const jobId = created.body.data.job._id;

    const save = await request(app).post('/api/jobs/save').set('Authorization', `Bearer ${sToken}`).send({ jobId });
    expect(save.status).toBe(200);

    const savedList = await request(app).get('/api/jobs/saved').set('Authorization', `Bearer ${sToken}`);
    expect(savedList.body.data.items.length).toBe(1);

    const apply = await request(app).post('/api/jobs/apply').set('Authorization', `Bearer ${sToken}`).send({ jobId });
    expect(apply.status).toBe(201);
    expect(apply.body.data.external).toBe(false);

    const dup = await request(app).post('/api/jobs/apply').set('Authorization', `Bearer ${sToken}`).send({ jobId });
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe('ALREADY_APPLIED');

    // External apply path.
    const ext = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${aToken}`)
      .send({
        title: 'External Role', company: 'BigCo', type: 'job',
        description: 'A role applied to through an external careers portal for the test.',
        workMode: 'hybrid', applicationLink: 'https://bigco.example/careers', applyThroughPlatform: false,
      });
    const extApply = await request(app).post('/api/jobs/apply').set('Authorization', `Bearer ${sToken}`).send({ jobId: ext.body.data.job._id });
    expect(extApply.body.data.external).toBe(true);
    expect(extApply.body.data.applicationLink).toBe('https://bigco.example/careers');
  });

  it('admin moderation approves a pending job and notifies the poster', async () => {
    await createUser({ email: 'a2@test.edu', role: 'alumni' });
    const aToken = await loginToken('a2@test.edu');
    await createUser({ email: 'adm@test.edu', role: 'admin' });
    const admToken = await loginToken('adm@test.edu');

    const created = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${aToken}`)
      .send({
        title: 'Pending Job', company: 'TestCo', type: 'job',
        description: 'Starts pending and gets approved by the admin in this test.',
        workMode: 'onsite', status: 'pending',
      });
    const jobId = created.body.data.job._id;

    const moderate = await request(app)
      .put(`/api/jobs/${jobId}/moderate`)
      .set('Authorization', `Bearer ${admToken}`)
      .send({ status: 'approved' });
    expect(moderate.status).toBe(200);
    expect(moderate.body.data.job.status).toBe('approved');

    // Non-admin cannot moderate.
    const blocked = await request(app)
      .put(`/api/jobs/${jobId}/moderate`)
      .set('Authorization', `Bearer ${aToken}`)
      .send({ status: 'approved' });
    expect(blocked.status).toBe(403);

    // Poster was notified.
    const notifs = await request(app).get('/api/notifications?type=job_status').set('Authorization', `Bearer ${aToken}`);
    expect(notifs.body.data.meta.total).toBe(1);
  });

  it('reports a job once and rejects duplicates', async () => {
    await createUser({ email: 'a3@test.edu', role: 'alumni' });
    const aToken = await loginToken('a3@test.edu');
    await createUser({ email: 's2@test.edu', role: 'student' });
    const sToken = await loginToken('s2@test.edu');

    const created = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${aToken}`)
      .send({
        title: 'Suspicious Role', company: 'Unknown', type: 'job',
        description: 'A listing that the student considers suspicious enough to report.',
        workMode: 'remote',
      });
    const jobId = created.body.data.job._id;

    const report = await request(app).post('/api/jobs/report').set('Authorization', `Bearer ${sToken}`).send({ jobId, reason: 'Suspicious listing' });
    expect(report.status).toBe(201);

    const dup = await request(app).post('/api/jobs/report').set('Authorization', `Bearer ${sToken}`).send({ jobId, reason: 'Again' });
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe('ALREADY_REPORTED');
  });
});
