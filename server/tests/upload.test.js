import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import request from 'supertest';
import { app, clearDB, connectTestDB, disconnectTestDB, createUser, loginToken } from './helpers.js';

const SERVER_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const UPLOADS_DIR = path.join(SERVER_ROOT, 'uploads');

/** 1×1 transparent PNG. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

/** Best-effort cleanup of files created during tests. */
async function removeUploads(...relativePaths) {
  for (const rel of relativePaths) {
    try {
      await fs.unlink(path.join(UPLOADS_DIR, rel));
    } catch {
      // ignore missing
    }
  }
}

beforeAll(async () => {
  await connectTestDB();
});
afterAll(async () => {
  await disconnectTestDB();
});
beforeEach(async () => {
  await clearDB();
});

describe('Uploads (spec §24)', () => {
  it('uploads a chat attachment and returns attachment metadata', async () => {
    await createUser({ email: 'u@test.edu', role: 'student' });
    const token = await loginToken('u@test.edu');

    const res = await request(app)
      .post('/api/upload?use=chat')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', PNG, { filename: 'shot.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(res.body.data.attachment).toMatchObject({
      name: 'shot.png',
      mimeType: 'image/png',
      publicId: null,
    });
    expect(res.body.data.attachment.url).toMatch(/^\/uploads\/chat\//);
    await removeUploads(res.body.data.attachment.url.replace(/^\/uploads\//, ''));
  });

  it('avatar upload keeps the new file and deletes only the previous one', async () => {
    await createUser({ email: 'av@test.edu', role: 'student' });
    const token = await loginToken('av@test.edu');

    const first = await request(app)
      .patch('/api/users/me/avatar?use=avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', PNG, { filename: 'one.png', contentType: 'image/png' });
    expect(first.status).toBe(200);
    const firstRel = first.body.data.avatar.url.replace(/^\/uploads\//, '');

    // The freshly uploaded file must exist on disk (regression: the previous
    // Mongoose subdocument reference used to alias the NEW avatar, so the new
    // file was deleted immediately after being written).
    await expect(fs.access(path.join(UPLOADS_DIR, firstRel))).resolves.toBeUndefined();

    const second = await request(app)
      .patch('/api/users/me/avatar?use=avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', PNG, { filename: 'two.png', contentType: 'image/png' });
    expect(second.status).toBe(200);
    const secondRel = second.body.data.avatar.url.replace(/^\/uploads\//, '');

    // Previous file cleaned up, new file persisted.
    await expect(fs.access(path.join(UPLOADS_DIR, firstRel))).rejects.toThrow();
    await expect(fs.access(path.join(UPLOADS_DIR, secondRel))).resolves.toBeUndefined();

    // The saved avatar URL is the new one.
    const me = await request(app).get('/api/users/me').set('Authorization', `Bearer ${token}`);
    expect(me.body.data.user.avatar.url).toBe(second.body.data.avatar.url);

    await removeUploads(firstRel, secondRel);
  });

  it('rejects unsupported file types per use-case whitelist', async () => {
    await createUser({ email: 'u2@test.edu', role: 'student' });
    const token = await loginToken('u2@test.edu');

    const res = await request(app)
      .post('/api/upload?use=avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('not an image'), { filename: 'doc.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('UNSUPPORTED_FILE_TYPE');
  });
});
