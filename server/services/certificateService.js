import crypto from 'node:crypto';
import Certificate from '../models/certificate.js';
import Event from '../models/event.js';
import Attendance from '../models/attendance.js';
import User from '../models/user.js';
import { badRequest, forbidden, notFound } from '../utils/ApiError.js';
import { toPdfBuffer } from '../utils/exporters.js';
import { qrPngBuffer } from '../utils/qr.js';
import { createNotification } from './notificationService.js';
import { logAudit } from '../utils/audit.js';

/**
 * Event certificates (spec §29): organizers/admins generate participation
 * certificates with a unique certificate ID and a QR that can be verified
 * publicly. Includes name, event, date, organizer, certificate ID.
 */
export async function generateCertificates({ eventId, userId, role, req }) {
  const event = await Event.findById(eventId).select('title date startTime endTime organizer status');
  if (!event) throw notFound('Event not found', 'EVENT_NOT_FOUND');
  if (role !== 'admin' && String(event.organizer) !== String(userId)) {
    throw forbidden('Only the organizer or an admin can issue certificates', 'CERTIFICATE_FORBIDDEN');
  }
  if (event.status !== 'completed') {
    throw badRequest('Certificates can only be issued after the event is completed', 'EVENT_NOT_COMPLETED');
  }

  // Attendees = present/late attendance records.
  const attendance = await Attendance.find({ event: eventId, status: { $in: ['present', 'late'] } })
    .populate({ path: 'user', select: 'name' })
    .lean();
  if (attendance.length === 0) throw badRequest('No attendees found for this event', 'NO_ATTENDEES');

  const issued = [];
  for (const record of attendance) {
    const existing = await Certificate.findOne({ event: eventId, user: record.user._id });
    if (existing) {
      issued.push({ user: record.user, certificateId: existing.certificateId, existing: true });
      continue;
    }

    const certificateId = `CC-${eventId.slice(-6).toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const certificate = await Certificate.create({
      event: eventId,
      user: record.user._id,
      certificateId,
      issuedBy: userId,
    });

    // Render the PDF + QR.
    try {
      const { buffer } = await renderCertificatePdf({ event, user: record.user, certificateId });
      certificate.pdf = {
        url: `data:application/pdf;base64,${buffer.toString('base64')}`,
        name: `certificate-${certificateId}.pdf`,
        mimeType: 'application/pdf',
        size: buffer.length,
      };
      certificate.qrCode = await qrPngBuffer(`${process.env.CLIENT_URL ?? 'http://localhost:5173'}/certificates/verify?certificateId=${certificateId}`, { width: 160 });
      await certificate.save();
    } catch (error) {
      console.warn('[certificates] pdf render failed:', error.message);
    }

    await createNotification({
      recipientId: record.user._id,
      type: 'certificate_issued',
      title: 'Certificate issued 🎓',
      body: `Your participation certificate for "${event.title}" is ready`,
      data: { url: '/certificates' },
    });

    issued.push({ user: record.user, certificateId });
  }

  await logAudit({
    action: 'certificate_issued',
    actorId: userId,
    targetType: 'event',
    targetId: eventId,
    details: { action: 'issue', count: issued.length },
    req,
  });

  return { issued, event: { _id: event._id, title: event.title } };
}

/** Render a certificate as a PDF buffer. */
export async function renderCertificatePdf({ event, user, certificateId }) {
  const buffer = await toPdfBuffer({
    title: 'Certificate of Participation',
    subtitle: `This is to certify that ${user.name} participated in`,
    rows: [
      {
        event: event.title,
        date: new Date(event.date).toLocaleDateString('en-IN'),
        org: String(event.organizer),
        cid: certificateId,
      },
    ],
    columns: [
      { key: 'event', header: 'Event', width: 32 },
      { key: 'date', header: 'Date', width: 16 },
      { key: 'org', header: 'Organizer ID', width: 20 },
      { key: 'cid', header: 'Certificate ID', width: 28 },
    ],
  });
  return { buffer, certificateId };
}

/** The user's own certificates. */
export async function listMyCertificates({ userId }) {
  const items = await Certificate.find({ user: userId })
    .sort({ issuedAt: -1 })
    .populate({ path: 'event', select: 'title date' })
    .lean();
  return items;
}

/** Public QR verification (spec §29): certificateId → validity. */
export async function verifyCertificate({ certificateId }) {
  const certificate = await Certificate.findOne({ certificateId })
    .populate({ path: 'user', select: 'name' })
    .populate({ path: 'event', select: 'title date' })
    .lean();
  if (!certificate) {
    throw notFound('Certificate not found', 'CERTIFICATE_NOT_FOUND');
  }
  return {
    valid: true,
    certificateId: certificate.certificateId,
    name: certificate.user?.name,
    event: certificate.event?.title,
    date: certificate.event?.date,
    issuedAt: certificate.issuedAt,
  };
}

/* ---------------------------------------------------------------------------
 * Badges (spec §29 verification badges)
 * ------------------------------------------------------------------------- */

const BADGE_AUTO = {
  verified_student: (user, _profile) => user.role === 'student' && user.isVerified && user.isApproved,
  verified_faculty: (user, _profile) => user.role === 'faculty' && user.isVerified && user.isApproved,
  verified_alumni: (user, _profile) => user.role === 'alumni' && user.isVerified && user.isApproved,
};

/** Recompute auto badges (called on verification/approval). */
export async function syncAutoBadges({ userId }) {
  const user = await User.findById(userId);
  if (!user) return;
  const auto = BADGE_AUTO[`verified_${user.role}`];
  if (auto && auto(user)) {
    if (!user.badges.includes(`verified_${user.role}`)) {
      user.badges.push(`verified_${user.role}`);
      await user.save();
    }
  }
}

/* ---------------------------------------------------------------------------
 * Reputation (spec §29, non-gamified): awarded for real contributions.
 * ------------------------------------------------------------------------- */

const REPUTATION_RULES = {
  resource_upload: 10, // approved upload
  event_participation: 5, // attended an event
  post_created: 2, // community post
  mentorship_completed: 25, // completed a mentorship
  donation: 15, // any donation
  helpful_comment: 1, // comment on a post
};

export const REPUTATION = REPUTATION_RULES;

/** Award reputation points (idempotent-ish: caller passes the rule). */
export async function awardReputation({ userId, rule }) {
  const points = REPUTATION_RULES[rule];
  if (!points) return 0;
  await User.updateOne({ _id: userId }, { $inc: { reputationScore: points } });
  return points;
}
