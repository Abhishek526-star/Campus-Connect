import { emailLayout, buttonHtml } from './layout.js';

/** Email verification (spec §31). */
export const renderVerificationEmail = ({ name, link }) =>
  emailLayout({
    title: 'Verify your email',
    bodyHtml: `
      <p>Hi ${name},</p>
      <p>Welcome to Campus Connect! Please confirm your email address to activate your account.</p>
      ${buttonHtml('Verify Email', link)}
      <p style="font-size:12px;color:#64748b;">This link expires in 24 hours. If you did not create an account, you can safely ignore this email.</p>
    `,
  });

/** Welcome after successful verification. */
export const renderWelcomeEmail = ({ name }) =>
  emailLayout({
    title: 'Welcome to Campus Connect 🎉',
    bodyHtml: `
      <p>Hi ${name},</p>
      <p>Your email is verified. You can now connect with students, faculty, and alumni, join events, explore opportunities, and give back to the community.</p>
      <p>See you inside!</p>
    `,
  });

/** Password reset link (spec §31). */
export const renderPasswordResetEmail = ({ name, link }) =>
  emailLayout({
    title: 'Reset your password',
    bodyHtml: `
      <p>Hi ${name},</p>
      <p>We received a request to reset your password. Click the button below to choose a new one.</p>
      ${buttonHtml('Reset Password', link)}
      <p style="font-size:12px;color:#64748b;">This link expires in 30 minutes. If you did not request this, you can safely ignore this email.</p>
    `,
  });

/** Pending admin approval (faculty/alumni). */
export const renderPendingApprovalEmail = ({ name }) =>
  emailLayout({
    title: 'Account pending approval',
    bodyHtml: `
      <p>Hi ${name},</p>
      <p>Thanks for registering with Campus Connect. Your account has been verified and is now awaiting approval by a campus administrator.</p>
      <p>You will receive an email as soon as your account is approved — usually within a day.</p>
    `,
  });

/** Account approved. */
export const renderApprovedEmail = ({ name, link }) =>
  emailLayout({
    title: 'Your account is approved ✅',
    bodyHtml: `
      <p>Hi ${name},</p>
      <p>Great news — your account has been approved! You can now sign in and explore the platform.</p>
      ${buttonHtml('Go to Campus Connect', link)}
    `,
  });
