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

async function createEvent(fToken) {
  const res = await request(app)
    .post('/api/events')
    .set('Authorization', `Bearer ${fToken}`)
    .send({
      title: 'Test Workshop', description: 'A workshop for automated tests with enough description text.',
      date: new Date(Date.now() + 7 * 86400000).toISOString(),
      category: 'workshop', mode: 'offline', venue: 'Lab 1', maxParticipants: 50,
    });
  return res.body.data.event;
}

describe('Events + Attendance + QR (spec §9, §10)', () => {
  it('create → register → duplicate guard → cancel → count', async () => {
    await createUser({ email: 'f@test.edu', role: 'faculty' });
    const fToken = await loginToken('f@test.edu');
    const event = await createEvent(fToken);

    await createUser({ email: 's@test.edu', role: 'student' });
    const sToken = await loginToken('s@test.edu');

    const reg = await request(app).post(`/api/events/${event._id}/register`).set('Authorization', `Bearer ${sToken}`);
    expect(reg.status).toBe(201);

    const dup = await request(app).post(`/api/events/${event._id}/register`).set('Authorization', `Bearer ${sToken}`);
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe('ALREADY_REGISTERED');

    const cancelled = await request(app).delete(`/api/events/${event._id}/register`).set('Authorization', `Bearer ${sToken}`);
    expect(cancelled.status).toBe(200);

    const detail = await request(app).get(`/api/events/${event._id}`).set('Authorization', `Bearer ${sToken}`);
    expect(detail.body.data.event.registrationsCount).toBe(0);
  });

  it('QR check-in: valid token works once, rotation invalidates old tokens, unregistered users blocked', async () => {
    await createUser({ email: 'f2@test.edu', role: 'faculty' });
    const fToken = await loginToken('f2@test.edu');
    const event = await createEvent(fToken);

    await createUser({ email: 's2@test.edu', role: 'student' });
    const sToken = await loginToken('s2@test.edu');
    await request(app).post(`/api/events/${event._id}/register`).set('Authorization', `Bearer ${sToken}`);

    const qr = await request(app).post(`/api/attendance/event/${event._id}/qr-token`).set('Authorization', `Bearer ${fToken}`).send({ durationMinutes: 15 });
    expect(qr.status).toBe(200);
    const token = qr.body.data.token;

    // Not-registered user blocked.
    await createUser({ email: 's3@test.edu', role: 'student' });
    const oToken = await loginToken('s3@test.edu');
    const blocked = await request(app).post('/api/attendance/check-in').set('Authorization', `Bearer ${oToken}`).send({ qrToken: token });
    expect(blocked.status).toBe(400);
    expect(blocked.body.error.code).toBe('NOT_REGISTERED');

    // Valid check-in.
    const ok = await request(app).post('/api/attendance/check-in').set('Authorization', `Bearer ${sToken}`).send({ qrToken: token });
    expect(ok.status).toBe(201);
    expect(ok.body.data.attendance.status).toBe('present');

    // Duplicate blocked (registration flips to "attended" after check-in).
    const dup = await request(app).post('/api/attendance/check-in').set('Authorization', `Bearer ${sToken}`).send({ qrToken: token });
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe('DUPLICATE_CHECKIN');

    // Rotation invalidates old token.
    const rotated = await request(app).post(`/api/attendance/event/${event._id}/qr-token`).set('Authorization', `Bearer ${fToken}`).send({ durationMinutes: 15 });
    await createUser({ email: 's4@test.edu', role: 'student' });
    const o2Token = await loginToken('s4@test.edu');
    await request(app).post(`/api/events/${event._id}/register`).set('Authorization', `Bearer ${o2Token}`);
    const oldToken = await request(app).post('/api/attendance/check-in').set('Authorization', `Bearer ${o2Token}`).send({ qrToken: token });
    expect(oldToken.status).toBe(400);
    expect(oldToken.body.error.code).toBe('INVALID_QR');
    const newToken = await request(app).post('/api/attendance/check-in').set('Authorization', `Bearer ${o2Token}`).send({ qrToken: rotated.body.data.token });
    expect(newToken.status).toBe(201);

    // Garbage token → INVALID_QR (not a cast error).
    const garbage = await request(app).post('/api/attendance/check-in').set('Authorization', `Bearer ${sToken}`).send({ qrToken: 'garbage:garbage:1' });
    expect(garbage.status).toBe(400);
    expect(garbage.body.error.code).toBe('INVALID_QR');

    // Organizer summary.
    const summary = await request(app).get(`/api/attendance/event/${event._id}/summary`).set('Authorization', `Bearer ${fToken}`);
    expect(summary.status).toBe(200);
    expect(summary.body.data.counts.present).toBe(2);
  });

  it('rejects registration after the deadline and when the event is full', async () => {
    await createUser({ email: 'f3@test.edu', role: 'faculty' });
    const fToken = await loginToken('f3@test.edu');
    const created = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${fToken}`)
      .send({
        title: 'Deadline Test', description: 'An event with a past registration deadline for the automated test.',
        date: new Date(Date.now() + 86400000).toISOString(),
        registrationDeadline: new Date(Date.now() - 86400000).toISOString(),
        category: 'webinar', mode: 'online', maxParticipants: 10,
      });
    const event = created.body.data.event;

    await createUser({ email: 's5@test.edu', role: 'student' });
    const sToken = await loginToken('s5@test.edu');
    const res = await request(app).post(`/api/events/${event._id}/register`).set('Authorization', `Bearer ${sToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('REGISTRATION_CLOSED');
  });
});
