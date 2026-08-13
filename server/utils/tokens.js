import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { unauthorized } from './ApiError.js';

/** Generate a cryptographically random opaque token (hex). */
export const generateRandomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

/** SHA-256 hash of a token — only hashes are persisted. */
export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const ACCESS_TOKEN_TYPE = 'access';

/**
 * Sign a short-lived access token for the given user.
 */
export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      type: ACCESS_TOKEN_TYPE,
    },
    env.jwtSecret,
    { expiresIn: env.jwtAccessExpiresIn },
  );
}

/**
 * Verify an access token. Throws ApiError(401) with a precise code.
 */
export function verifyAccessToken(token) {
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    if (payload.type !== ACCESS_TOKEN_TYPE) throw new Error('wrong token type');
    return payload;
  } catch (error) {
    if (error.name === 'TokenExpiredError') throw unauthorized('Access token expired', 'ACCESS_TOKEN_EXPIRED');
    throw unauthorized('Invalid access token', 'INVALID_ACCESS_TOKEN');
  }
}
