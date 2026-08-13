import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { cloudinary } from '../config/cloudinary.js';
import { env } from '../config/env.js';

const SERVER_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCAL_UPLOADS_DIR = path.join(SERVER_ROOT, 'uploads');

/**
 * Upload a file buffer. Primary storage is Cloudinary (spec §24); when
 * Cloudinary credentials are absent (local development) files are stored on
 * disk under server/uploads/ and served statically.
 *
 * @returns {Promise<{url: string, publicId: string|null}>}
 */
export async function uploadFile({ buffer, originalName, mimetype, use, userId }) {
  if (env.cloudinary.isConfigured) {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `campus-connect/${use}`,
          public_id: `${use}-${userId}-${crypto.randomBytes(8).toString('hex')}`,
          resource_type: 'auto',
          // Image transforms keep avatars/event covers small and consistent.
          ...(mimetype.startsWith('image/') && use === 'avatar'
            ? { transformation: [{ width: 400, height: 400, crop: 'fill' }] }
            : {}),
          ...(mimetype.startsWith('image/') && use === 'event'
            ? { transformation: [{ width: 1280, crop: 'scale' }] }
            : {}),
        },
        (error, result) => (error ? reject(error) : resolve(result)),
      );
      stream.end(buffer);
    });

    return { url: result.secure_url, publicId: result.public_id };
  }

  // --- Local fallback (development only) ---
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60);
  const fileName = `${use}-${Date.now()}-${crypto.randomBytes(6).toString('hex')}-${safeName}`;
  const dir = path.join(LOCAL_UPLOADS_DIR, use);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, fileName), buffer);

  return { url: `/uploads/${use}/${fileName}`, publicId: null };
}

/** Delete an uploaded file (Cloudinary or local fallback). */
export async function deleteFile({ publicId, url }) {
  if (publicId && env.cloudinary.isConfigured) {
    try {
      await cloudinary.uploader.destroy(publicId);
      return;
    } catch (error) {
      console.warn(`[upload] cloudinary delete failed for ${publicId}: ${error.message}`);
      return;
    }
  }
  if (url && url.startsWith('/uploads/')) {
    const filePath = path.join(SERVER_ROOT, url.replace(/^\//, ''));
    try {
      await fs.unlink(filePath);
    } catch {
      // ignore missing file
    }
  }
}
