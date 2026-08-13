import { env } from '../config/env.js';
import { sendMail } from '../config/mailer.js';
import {
  renderApprovedEmail,
  renderPasswordResetEmail,
  renderPendingApprovalEmail,
  renderVerificationEmail,
  renderWelcomeEmail,
} from '../emails/index.js';
import { REFRESH_COOKIE_PATH } from '../config/constants.js';

/** Build absolute app URLs. */
const appUrl = (path) => `${env.clientUrl}${path}`;

export const emailService = {
  async sendVerificationEmail({ to, name, token }) {
    return sendMail({
      to,
      subject: 'Verify your email — Campus Connect',
      html: renderVerificationEmail({
        name,
        link: appUrl(`/verify-email?token=${token}`),
      }),
    });
  },

  async sendWelcomeEmail({ to, name }) {
    return sendMail({
      to,
      subject: 'Welcome to Campus Connect 🎉',
      html: renderWelcomeEmail({ name }),
    });
  },

  async sendPasswordResetEmail({ to, name, token }) {
    return sendMail({
      to,
      subject: 'Reset your password — Campus Connect',
      html: renderPasswordResetEmail({
        name,
        link: appUrl(`/reset-password?token=${token}`),
      }),
    });
  },

  async sendPendingApprovalEmail({ to, name }) {
    return sendMail({
      to,
      subject: 'Account pending approval — Campus Connect',
      html: renderPendingApprovalEmail({ name }),
    });
  },

  async sendApprovedEmail({ to, name }) {
    return sendMail({
      to,
      subject: 'Your account is approved ✅',
      html: renderApprovedEmail({ name, link: appUrl('/login') }),
    });
  },

  /** Whether real email delivery is configured (else dev console mode). */
  isConfigured: env.smtp.isConfigured,
};

/** Cookie options for the httpOnly refresh token (spec §25). */
export const refreshCookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: 'lax',
  path: REFRESH_COOKIE_PATH,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
