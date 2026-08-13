import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/user.js';
import StudentProfile from '../models/studentProfile.js';
import FacultyProfile from '../models/facultyProfile.js';
import AlumniProfile from '../models/alumniProfile.js';
import {
  APPROVAL_REQUIRED_ROLES,
  EMAIL_VERIFICATION_EXPIRY_HOURS,
  PASSWORD_RESET_EXPIRY_MINUTES,
  ROLES,
} from '../config/constants.js';
import {
  badRequest,
  conflict,
  notFound,
  unauthorized,
} from '../utils/ApiError.js';
import { hashToken, generateRandomToken, signAccessToken } from '../utils/tokens.js';
import {
  findValidRefreshToken,
  getRefreshTokenUserId,
  issueRefreshToken,
  revokeAllUserTokens,
  revokeRefreshToken,
  rotateRefreshToken,
} from '../utils/tokenStore.js';
import { emailService } from './emailService.js';
import { createNotification, notifyAdmins } from './notificationService.js';
import { logAudit } from '../utils/audit.js';
import { env } from '../config/env.js';

const BCRYPT_ROUNDS = 12;

const PROFILE_MODELS = {
  student: StudentProfile,
  faculty: FacultyProfile,
  alumni: AlumniProfile,
};

/** Normalize & validate the email is not already registered. */
async function assertEmailAvailable(email) {
  const existing = await User.findOne({ email }).select('_id').lean();
  if (existing) throw conflict('An account with this email already exists', 'EMAIL_IN_USE');
}

/** Create the role-specific profile document. */
function buildProfileFields(role, data) {
  if (role === 'student') {
    return {
      rollNumber: data.rollNumber,
      department: data.department,
      course: data.course,
      year: data.year,
      graduationYear: data.graduationYear,
      phone: data.phone,
    };
  }
  if (role === 'faculty') {
    return {
      employeeId: data.employeeId,
      department: data.department,
      designation: data.designation,
    };
  }
  // alumni
  return {
    graduationYear: data.graduationYear,
    department: data.department,
    degree: data.degree,
    currentCompany: data.currentCompany ?? '',
    designation: data.designation ?? '',
  };
}

/**
 * Register a new account (spec §3).
 * - Students: auto-approved after email verification.
 * - Faculty/Alumni: require admin approval before login.
 */
export async function registerUser({ data, req }) {
  const { role, name, email, password } = data;
  const normalizedEmail = email.toLowerCase().trim();

  await assertEmailAvailable(normalizedEmail);

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const verificationToken = generateRandomToken(24);
  const requiresApproval = APPROVAL_REQUIRED_ROLES.includes(role);

  const user = await User.create({
    name,
    email: normalizedEmail,
    passwordHash,
    role,
    phone: data.phone ?? '',
    isVerified: false,
    isApproved: !requiresApproval,
    verificationTokenHash: hashToken(verificationToken),
    verificationTokenExpiresAt: new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000),
  });

  await PROFILE_MODELS[role].create({
    user: user._id,
    ...buildProfileFields(role, data),
  });

  await emailService.sendVerificationEmail({ to: normalizedEmail, name, token: verificationToken });

  await logAudit({
    action: 'register',
    actorId: user._id,
    targetType: 'user',
    targetId: user._id,
    details: { role },
    req,
  });

  if (requiresApproval) {
    await notifyAdmins({
      type: 'pending_registration',
      title: 'New registration awaiting approval',
      body: `${name} registered as ${role}.`,
      data: { userId: user._id.toString(), role },
    });
  }

  return { userId: user._id, requiresApproval };
}

/** Verify the email with a single-use token. */
export async function verifyEmail({ token, req }) {
  const user = await User.findOne({
    verificationTokenHash: hashToken(token),
    verificationTokenExpiresAt: { $gt: new Date() },
  });

  if (!user) throw badRequest('Invalid or expired verification link', 'INVALID_VERIFICATION_TOKEN');

  user.isVerified = true;
  user.verificationTokenHash = undefined;
  user.verificationTokenExpiresAt = undefined;
  await user.save();

  await emailService.sendWelcomeEmail({ to: user.email, name: user.name });
  await createNotification({
    recipientId: user._id,
    type: 'account_verified',
    title: 'Email verified 🎉',
    body: 'Your account is active. Welcome to Campus Connect!',
  });
  await logAudit({ action: 'verify_email', actorId: user._id, targetType: 'user', targetId: user._id, req });

  const requiresApproval = APPROVAL_REQUIRED_ROLES.includes(user.role);
  if (requiresApproval) {
    await emailService.sendPendingApprovalEmail({ to: user.email, name: user.name });
  }

  return { isApproved: user.isApproved, requiresApproval };
}

/** Resend the verification email. */
export async function resendVerification({ email }) {
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user || user.isVerified) return;

  const token = generateRandomToken(24);
  user.verificationTokenHash = hashToken(token);
  user.verificationTokenExpiresAt = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);
  await user.save();

  await emailService.sendVerificationEmail({ to: user.email, name: user.name, token });
}

/** Shared account-state gates + token issuance for password and Google login. */
async function establishSession(user, { req, auditAction }) {
  if (!user.isVerified) {
    throw unauthorized('Please verify your email before logging in', 'EMAIL_NOT_VERIFIED', { email: user.email });
  }
  if (!user.isApproved) {
    throw unauthorized('Your account is pending admin approval', 'ACCOUNT_PENDING_APPROVAL');
  }
  if (!user.isActive) {
    throw unauthorized('This account has been deactivated. Contact the administrator.', 'ACCOUNT_DISABLED');
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const accessToken = signAccessToken(user);
  const refresh = await issueRefreshToken(user._id, {
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  await logAudit({ action: auditAction, actorId: user._id, targetType: 'user', targetId: user._id, req });

  return { user: await serializeUser(user), accessToken, refreshToken: refresh.token, refreshExpiresAt: refresh.expiresAt };
}

/**
 * Login — verifies credentials + account state, issues access token and
 * refresh token (httpOnly cookie set by the controller).
 */
export async function loginUser({ email, password, req }) {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');

  if (!user) throw unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  if (!user.passwordHash) throw unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) throw unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');

  return establishSession(user, { req, auditAction: 'login' });
}

/**
 * Google (Gmail) sign-in — verifies the Google ID token, then either logs in
 * an existing account (matched by email or googleId) or creates a new verified
 * student account on the spot ("direct login").
 */
export async function loginWithGoogle({ idToken, req }) {
  if (!env.google.isConfigured) {
    throw badRequest('Google sign-in is not configured. Add GOOGLE_CLIENT_ID to server/.env.', 'GOOGLE_NOT_CONFIGURED');
  }

  let payload;
  try {
    const client = new OAuth2Client(env.google.clientId);
    const ticket = await client.verifyIdToken({ idToken, audience: env.google.clientId });
    payload = ticket.getPayload();
  } catch {
    throw unauthorized('Invalid Google sign-in token', 'INVALID_GOOGLE_TOKEN');
  }

  const email = String(payload?.email ?? '').toLowerCase().trim();
  if (!email || !payload.email_verified) {
    throw unauthorized('Your Google account email is not verified', 'GOOGLE_EMAIL_UNVERIFIED');
  }

  let user = await User.findOne({ $or: [{ email }, { googleId: payload.sub }] });
  let isNew = false;

  if (!user) {
    // Direct signup: Google already verified the email, so the account is
    // created verified and approved (students are auto-approved). The role
    // profile (roll number, department, …) is created when the student
    // completes their profile — no placeholder data is ever written.
    isNew = true;
    user = await User.create({
      name: String(payload.name ?? email.split('@')[0]).trim().slice(0, 80),
      email,
      role: 'student',
      isVerified: true,
      isApproved: true,
      googleId: payload.sub,
      avatar: payload.picture ? { url: payload.picture, publicId: null } : undefined,
    });

    await emailService.sendWelcomeEmail({ to: email, name: user.name });
    await createNotification({
      recipientId: user._id,
      type: 'account_verified',
      title: 'Welcome to Campus Connect 🎉',
      body: 'Your account was created with Google. Complete your student profile to get started.',
    });
  } else {
    // Existing account — Google is an additional login method (role gates apply).
    if (user.googleId !== payload.sub) {
      user.googleId = payload.sub;
      await user.save({ validateBeforeSave: false });
    }
  }

  const result = await establishSession(user, { req, auditAction: isNew ? 'register' : 'login' });
  if (isNew) {
    await logAudit({
      action: 'google_signup',
      actorId: user._id,
      targetType: 'user',
      targetId: user._id,
      details: { provider: 'google' },
      req,
    });
  }
  return result;
}

/** Rotate the refresh token and return a fresh access token pair. */
export async function refreshSession({ refreshToken, req }) {
  const record = await findValidRefreshToken(refreshToken);
  if (!record) throw unauthorized('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');

  const user = await User.findById(record.user).select('name email role avatar isVerified isApproved isActive');
  if (!user || !user.isActive) throw unauthorized('Account unavailable', 'ACCOUNT_INVALID');

  const rotated = await rotateRefreshToken(refreshToken, {
    userId: user._id,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });
  if (!rotated) throw unauthorized('Refresh token rotation failed', 'INVALID_REFRESH_TOKEN');

  return {
    accessToken: signAccessToken(user),
    refreshToken: rotated.token,
    refreshExpiresAt: rotated.expiresAt,
  };
}

/** Logout — revoke the presented refresh token (idempotent). */
export async function logoutUser({ refreshToken, req }) {
  let actorId = req.user?._id ?? null;

  if (refreshToken) {
    // The actor can be identified from the token even without an access token.
    const tokenUserId = await getRefreshTokenUserId(refreshToken);
    if (tokenUserId) actorId = tokenUserId;
    await revokeRefreshToken(refreshToken);
  }

  if (actorId) {
    await logAudit({ action: 'logout', actorId, targetType: 'user', targetId: actorId, req });
  }
}

/** Forgot password — always responds generically (no account enumeration). */
export async function forgotPassword({ email }) {
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user || !user.isVerified) return;

  const token = generateRandomToken(32);
  user.resetTokenHash = hashToken(token);
  user.resetTokenExpiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MINUTES * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  await emailService.sendPasswordResetEmail({ to: user.email, name: user.name, token });
}

/** Reset the password with a single-use token. Revokes all sessions. */
export async function resetPassword({ token, password, req }) {
  const user = await User.findOne({
    resetTokenHash: hashToken(token),
    resetTokenExpiresAt: { $gt: new Date() },
  });
  if (!user) throw badRequest('Invalid or expired reset link', 'INVALID_RESET_TOKEN');

  user.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  user.resetTokenHash = undefined;
  user.resetTokenExpiresAt = undefined;
  await user.save({ validateBeforeSave: false });

  await revokeAllUserTokens(user._id);
  await logAudit({ action: 'reset_password', actorId: user._id, targetType: 'user', targetId: user._id, req });
}

/** Change password for an authenticated user. */
export async function changePassword({ userId, currentPassword, newPassword, req }) {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw notFound('User not found', 'USER_NOT_FOUND');

  if (!user.passwordHash) {
    throw badRequest(
      'This account uses Google sign-in and has no password. Use "Forgot password" to set one via email.',
      'NO_PASSWORD_SET',
    );
  }

  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) throw badRequest('Current password is incorrect', 'WRONG_CURRENT_PASSWORD');

  user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await user.save({ validateBeforeSave: false });

  await revokeAllUserTokens(userId);
  await logAudit({ action: 'change_password', actorId: userId, targetType: 'user', targetId: userId, req });
}

/** Load a user + role profile into the canonical client shape. */
export async function serializeUser(userDoc) {
  const user = userDoc._id ? userDoc : await User.findById(userDoc);
  if (!user) throw notFound('User not found', 'USER_NOT_FOUND');

  const profile = await PROFILE_MODELS[user.role]?.findOne({ user: user._id }).lean() ?? null;

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar ?? { url: '', publicId: '' },
    phone: user.phone ?? '',
    isVerified: user.isVerified,
    isApproved: user.isApproved,
    isActive: user.isActive,
    badges: user.badges ?? [],
    reputationScore: user.reputationScore ?? 0,
    privacy: user.privacy ?? {},
    profileCompleted: Boolean(profile),
    profile,
    createdAt: user.createdAt,
  };
}

export { ROLES };
