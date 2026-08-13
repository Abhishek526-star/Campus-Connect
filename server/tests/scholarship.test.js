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

async function createCampaign(token) {
  const res = await request(app)
    .post('/api/scholarships')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Test Scholarship', description: 'A scholarship created for the automated test suite.',
      eligibility: 'Students with CGPA above 7.0 and low family income.',
      minimumRequirements: ['CGPA >= 7.0'], maxApplicants: 3, amount: 25000, targetAmount: 75000,
      deadline: new Date(Date.now() + 30 * 86400000).toISOString(),
      requiredDocuments: ['Income certificate'], category: 'need_based',
    });
  return res.body.data.scholarship;
}

describe('Scholarships + applications + review workflow (spec §11, §13)', () => {
  it('student applies with documents; duplicate blocked; sponsor notified via review queue', async () => {
    await createUser({ email: 'a@test.edu', role: 'alumni' });
    const aToken = await loginToken('a@test.edu');
    const campaign = await createCampaign(aToken);

    await createUser({ email: 's@test.edu', role: 'student' });
    const sToken = await loginToken('s@test.edu');

    const apply = await request(app)
      .post(`/api/scholarships/${campaign._id}/apply`)
      .set('Authorization', `Bearer ${sToken}`)
      .send({
        scholarshipId: campaign._id, rollNumber: 'CSE-1', department: 'Computer Science',
        familyIncome: 200000, academicPerformance: 85,
        reason: 'I need financial support to continue my education and pursue my goals.',
        documents: [{ url: '/uploads/test/doc.pdf', name: 'income.pdf', mimeType: 'application/pdf', size: 100 }],
      });
    expect(apply.status).toBe(201);
    expect(apply.body.data.application.status).toBe('applied');

    const dup = await request(app)
      .post(`/api/scholarships/${campaign._id}/apply`)
      .set('Authorization', `Bearer ${sToken}`)
      .send({
        scholarshipId: campaign._id, rollNumber: 'CSE-1', department: 'Computer Science',
        familyIncome: 200000, academicPerformance: 85,
        reason: 'A duplicate application should be rejected by the system here.',
        documents: [{ url: '/uploads/test/doc.pdf', name: 'income.pdf', mimeType: 'application/pdf', size: 100 }],
      });
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe('ALREADY_APPLIED');

    const queue = await request(app).get('/api/scholarships/applications/review').set('Authorization', `Bearer ${aToken}`);
    expect(queue.body.data.meta.total).toBe(1);
  });

  it('enforces the review state machine with transition validation', async () => {
    await createUser({ email: 'a2@test.edu', role: 'alumni' });
    const aToken = await loginToken('a2@test.edu');
    const campaign = await createCampaign(aToken);

    await createUser({ email: 's2@test.edu', role: 'student' });
    const sToken = await loginToken('s2@test.edu');
    const apply = await request(app)
      .post(`/api/scholarships/${campaign._id}/apply`)
      .set('Authorization', `Bearer ${sToken}`)
      .send({
        scholarshipId: campaign._id, rollNumber: 'CSE-2', department: 'CS',
        familyIncome: 150000, academicPerformance: 90,
        reason: 'Strong academic record and genuine financial need for support.',
        documents: [{ url: '/uploads/test/doc.pdf', name: 'doc.pdf', mimeType: 'application/pdf', size: 50 }],
      });
    const applicationId = apply.body.data.application._id;

    // Invalid jump: applied → approved is not allowed.
    const bad = await request(app)
      .put(`/api/scholarships/applications/${applicationId}/review`)
      .set('Authorization', `Bearer ${aToken}`)
      .send({ status: 'approved' });
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('INVALID_TRANSITION');

    // Valid progression.
    for (const status of ['under_review', 'shortlisted', 'approved', 'funded']) {
      const step = await request(app)
        .put(`/api/scholarships/applications/${applicationId}/review`)
        .set('Authorization', `Bearer ${aToken}`)
        .send({ status, comment: `moving to ${status}` });
      expect(step.status).toBe(200);
      expect(step.body.data.application.status).toBe(status);
    }

    // Campaign stats updated.
    const campaignCheck = await request(app).get(`/api/scholarships/${campaign._id}`).set('Authorization', `Bearer ${sToken}`);
    expect(campaignCheck.body.data.scholarship.studentsSupported).toBe(1);
    expect(campaignCheck.body.data.scholarship.applicantsCount).toBe(1);
  });

  it('non-reviewers cannot see the review queue', async () => {
    await createUser({ email: 's3@test.edu', role: 'student' });
    const sToken = await loginToken('s3@test.edu');
    const res = await request(app).get('/api/scholarships/applications/review').set('Authorization', `Bearer ${sToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('REVIEW_FORBIDDEN');
  });

  it('students cannot create campaigns (RBAC)', async () => {
    await createUser({ email: 's4@test.edu', role: 'student' });
    const sToken = await loginToken('s4@test.edu');
    const res = await request(app)
      .post('/api/scholarships')
      .set('Authorization', `Bearer ${sToken}`)
      .send({
        name: 'Nope', description: 'A campaign that students cannot create at all.',
        eligibility: 'Students cannot create campaigns on this platform at all.', amount: 1000, targetAmount: 1000,
        deadline: new Date(Date.now() + 86400000).toISOString(),
      });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('SCHOLARSHIP_CREATE_FORBIDDEN');
  });
});
