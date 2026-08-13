import RefreshToken from '../models/refreshToken.js';
import { hashToken, generateRandomToken } from './tokens.js';
import { REFRESH_TOKEN_EXPIRY_DAYS } from '../config/constants.js';

const EXPIRY_MS = REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

/**
 * Issue a refresh token for a user. Only the SHA-256 hash is stored.
 * @returns {Promise<{token: string, expiresAt: Date}>}
 */
export async function issueRefreshToken(userId, { ipAddress, userAgent } = {}) {
  const token = generateRandomToken(48);
  const expiresAt = new Date(Date.now() + EXPIRY_MS);

  await RefreshToken.create({
    user: userId,
    tokenHash: hashToken(token),
    expiresAt,
    ipAddress,
    userAgent,
  });

  return { token, expiresAt };
}

/**
 * Find a non-revoked, non-expired refresh token by its plaintext value.
 */
export async function findValidRefreshToken(token) {
  const record = await RefreshToken.findOne({ tokenHash: hashToken(token) });
  if (!record) return null;
  if (record.revokedAt || record.expiresAt <= new Date()) return null;
  return record;
}

/** Revoke a single token record (used on logout and rotation). */
export async function revokeRefreshToken(token, replacedByHash = null) {
  await RefreshToken.updateOne(
    { tokenHash: hashToken(token) },
    { $set: { revokedAt: new Date(), replacedBy: replacedByHash } },
  );
}

/** Return the userId a token belongs to (null when unknown). */
export async function getRefreshTokenUserId(token) {
  const record = await RefreshToken.findOne({ tokenHash: hashToken(token) }).select('user');
  return record ? record.user : null;
}

/** Revoke every refresh token of a user (password change, account disable…). */
export async function revokeAllUserTokens(userId) {
  await RefreshToken.updateMany(
    { user: userId, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
}

/**
 * Rotate: revoke the presented token and issue a fresh one.
 * Returns null when the presented token is invalid.
 */
export async function rotateRefreshToken(token, { userId, ipAddress, userAgent } = {}) {
  const record = await findValidRefreshToken(token);
  if (!record) return null;
  if (!userId || record.user.toString() !== String(userId)) return null;

  const next = await issueRefreshToken(userId, { ipAddress, userAgent });
  await revokeRefreshToken(token, hashToken(next.token));
  return next;
}
