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

describe('Chat (spec §7) — conversations, messages, block', () => {
  it('creates a direct conversation, sends messages, lists them, deletes for self', async () => {
    await createUser({ email: 'a@test.edu', role: 'alumni' });
    const student = await createUser({ email: 's@test.edu', role: 'student' });
    const aToken = await loginToken('a@test.edu');
    const sToken = await loginToken('s@test.edu');

    const conv = await request(app)
      .post('/api/conversations/direct')
      .set('Authorization', `Bearer ${aToken}`)
      .send({ userId: student._id.toString() });
    expect(conv.status).toBe(201);
    const conversationId = conv.body.data.conversation._id;

    const msg = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${aToken}`)
      .send({ conversationId, content: 'Hello from the test suite!', kind: 'text' });
    expect(msg.status).toBe(201);

    const list = await request(app).get(`/api/messages/${conversationId}`).set('Authorization', `Bearer ${sToken}`);
    expect(list.body.data.meta.total).toBe(1);
    expect(list.body.data.items[0].content).toBe('Hello from the test suite!');

    // Delete for self (sender only).
    const messageId = msg.body.data.message._id;
    const deleted = await request(app).delete(`/api/messages/${messageId}`).set('Authorization', `Bearer ${aToken}`);
    expect(deleted.status).toBe(200);

    const after = await request(app).get(`/api/messages/${conversationId}`).set('Authorization', `Bearer ${aToken}`);
    expect(after.body.data.meta.total).toBe(0);

    // Conversation list still exists for the recipient.
    const conversations = await request(app).get('/api/conversations').set('Authorization', `Bearer ${sToken}`);
    expect(conversations.body.data.items.length).toBe(1);
  });

  it('blocks messaging in both directions and unblocks', async () => {
    await createUser({ email: 'a2@test.edu', role: 'alumni' });
    const student = await createUser({ email: 's2@test.edu', role: 'student' });
    const aToken = await loginToken('a2@test.edu');
    const sToken = await loginToken('s2@test.edu');

    const conv = await request(app)
      .post('/api/conversations/direct')
      .set('Authorization', `Bearer ${aToken}`)
      .send({ userId: student._id.toString() });
    const conversationId = conv.body.data.conversation._id;

    const block = await request(app)
      .post('/api/conversations/block')
      .set('Authorization', `Bearer ${aToken}`)
      .send({ userId: student._id.toString() });
    expect(block.status).toBe(200);

    // Both directions blocked by the service (assertNotBlocked checks either direction).
    const fromStudent = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${sToken}`)
      .send({ conversationId, content: 'hello?', kind: 'text' });
    expect(fromStudent.status).toBe(403);
    expect(fromStudent.body.error.code).toBe('CHAT_BLOCKED');

    const fromAlumni = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${aToken}`)
      .send({ conversationId, content: 'hello?', kind: 'text' });
    expect(fromAlumni.status).toBe(403);

    const unblock = await request(app)
      .delete('/api/conversations/block')
      .set('Authorization', `Bearer ${aToken}`)
      .send({ userId: student._id.toString() });
    expect(unblock.status).toBe(200);

    const msg = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${sToken}`)
      .send({ conversationId, content: 'Thanks!', kind: 'text' });
    expect(msg.status).toBe(201);
  });

  it('rejects empty messages and self-messages', async () => {
    const student = await createUser({ email: 's3@test.edu', role: 'student' });
    const sToken = await loginToken('s3@test.edu');

    const self = await request(app)
      .post('/api/conversations/direct')
      .set('Authorization', `Bearer ${sToken}`)
      .send({ userId: student._id.toString() });
    expect(self.status).toBe(400);
    expect(self.body.error.code).toBe('SELF_MESSAGE');
  });
});
