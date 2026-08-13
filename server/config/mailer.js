import nodemailer from 'nodemailer';
import { env } from './env.js';

let transport = null;

/**
 * Lazily created Nodemailer transport.
 * Returns null when SMTP is not configured — callers then log the email to
 * the console (development mode) instead of failing.
 */
export function getTransport() {
  if (!env.smtp.isConfigured) return null;
  if (!transport) {
    transport = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.password },
    });
  }
  return transport;
}

/**
 * Send an email. In development without SMTP credentials the email is logged
 * to the console so flows remain testable locally.
 * @returns {Promise<{delivered: boolean, preview: string}>}
 */
export async function sendMail({ to, subject, html }) {
  const transportInstance = getTransport();

  if (!transportInstance) {
    // Development mode: log the email content including any link URLs
    // (e.g. verification tokens) so flows can be tested end-to-end.
    const links = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500);
    const preview = `[dev-email] To: ${to} | Subject: ${subject}\n  ${text}\n  links: ${links.join('\n          ')}`;
    console.log(preview);
    return { delivered: false, preview };
  }

  await transportInstance.sendMail({
    from: env.smtp.from,
    to,
    subject,
    html,
  });
  return { delivered: true };
}
