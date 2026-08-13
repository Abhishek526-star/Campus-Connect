import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { refreshCookieOptions } from '../services/emailService.js';
import { REFRESH_COOKIE_NAME } from '../config/constants.js';
import { unauthorized } from '../utils/ApiError.js';
import {
  changePassword as changePasswordService,
  forgotPassword as forgotPasswordService,
  loginUser,
  loginWithGoogle,
  logoutUser,
  refreshSession,
  registerUser,
  resendVerification as resendVerificationService,
  resetPassword as resetPasswordService,
  serializeUser,
  verifyEmail as verifyEmailService,
} from '../services/authService.js';

export const register = asyncHandler(async (req, res) => {
  const result = await registerUser({ data: req.body, req });
  sendSuccess(res, {
    status: 201,
    message: result.requiresApproval
      ? 'Registration successful. Verify your email — your account will need admin approval after that.'
      : 'Registration successful. Please verify your email to activate your account.',
    data: { userId: result.userId, requiresApproval: result.requiresApproval },
  });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const result = await verifyEmailService({ token: req.body.token, req });
  sendSuccess(res, {
    message: result.requiresApproval
      ? 'Email verified. Your account is now pending admin approval.'
      : 'Email verified successfully. Welcome to Campus Connect!',
    data: result,
  });
});

export const resendVerification = asyncHandler(async (req, res) => {
  await resendVerificationService({ email: req.body.email });
  // Always return the same generic message (no account enumeration).
  sendSuccess(res, {
    message: 'If that email is registered, a new verification link has been sent.',
  });
});

export const login = asyncHandler(async (req, res) => {
  const result = await loginUser({ email: req.body.email, password: req.body.password, req });

  res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions);
  sendSuccess(res, {
    message: 'Login successful',
    data: { user: result.user, accessToken: result.accessToken },
  });
});

/** POST /api/auth/google — Google (Gmail) direct login with an ID token. */
export const googleLogin = asyncHandler(async (req, res) => {
  const result = await loginWithGoogle({ idToken: req.body.credential, req });

  res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions);
  sendSuccess(res, {
    message: 'Signed in with Google',
    data: { user: result.user, accessToken: result.accessToken },
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!refreshToken) throw unauthorized('No refresh token', 'INVALID_REFRESH_TOKEN');

  const result = await refreshSession({ refreshToken, req });

  res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions);
  sendSuccess(res, {
    message: 'Session refreshed',
    data: { accessToken: result.accessToken },
  });
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
  await logoutUser({ refreshToken, req });
  res.clearCookie(REFRESH_COOKIE_NAME, { path: refreshCookieOptions.path });
  sendSuccess(res, { message: 'Logged out successfully' });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await forgotPasswordService({ email: req.body.email });
  sendSuccess(res, {
    message: 'If that email is registered, a password reset link has been sent.',
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await resetPasswordService({ token: req.body.token, password: req.body.password, req });
  sendSuccess(res, { message: 'Password reset successfully. You can now log in.' });
});

export const me = asyncHandler(async (req, res) => {
  const user = await serializeUser(req.user);
  sendSuccess(res, { message: 'Current user', data: { user } });
});

export const changePassword = asyncHandler(async (req, res) => {
  await changePasswordService({
    userId: req.user._id,
    currentPassword: req.body.currentPassword,
    newPassword: req.body.newPassword,
    req,
  });
  sendSuccess(res, { message: 'Password changed successfully. Please log in again.' });
});
