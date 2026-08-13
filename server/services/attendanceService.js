import crypto from 'node:crypto';
import Event from '../models/event.js';
import EventRegistration from '../models/eventRegistration.js';
import Attendance from '../models/attendance.js';
import User from '../models/user.js';
import { badRequest, conflict, forbidden, notFound } from '../utils/ApiError.js';
import { createNotification } from './notificationService.js';
import { awardReputation } from './certificateService.js';
import { logAudit } from '../utils/audit.js';
import { qrPngBuffer } from '../utils/qr.js';

const EVENT_SELECT = 'title date startTime endTime organizer status qr';
const ORGANIZER_POPULATE = { path: 'organizer', select: 'name avatar' };
const USER_POPULATE = { path: 'user', select: 'name email avatar role' };

/** Organizer-or-admin guard for an event. */
export async function assertCanManageEvent(eventId, user) {
  const event = await Event.findById(eventId).select('organizer');
  if (!event) throw notFound('Event not found', 'EVENT_NOT_FOUND');
  if (user.role !== 'admin' && String(event.organizer) !== String(user._id)) {
    throw forbidden('Only the organizer or an admin can manage attendance', 'ATTENDANCE_FORBIDDEN');
  }
  return event;
}

/**
 * Generate a QR token for an event (spec §10):
 * - unique per event (rotating secret hash stored on the event)
 * - expires (default 15 min)
 * - the returned token embeds eventId + secret + expiry; only the hash
 *   of the secret is ever stored server-side
 */
export async function generateQrToken({ eventId, userId, role, durationMinutes = 15, req }) {
  const event = await Event.findById(eventId).select('title organizer');
  if (!event) throw notFound('Event not found', 'EVENT_NOT_FOUND');
  if (role !== 'admin' && String(event.organizer) !== String(userId)) {
    throw forbidden('Only the organizer or an admin can generate the QR code', 'ATTENDANCE_FORBIDDEN');
  }

  const secret = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
  const token = buildQrToken({ eventId, secret, expiresAt });

  await Event.updateOne(
    { _id: eventId },
    {
      $set: {
        'qr.secretHash': crypto.createHash('sha256').update(secret).digest('hex'),
        'qr.expiresAt': expiresAt,
      },
    },
  );

  await logAudit({
    action: 'attendance_modify',
    actorId: userId,
    targetType: 'event',
    targetId: eventId,
    details: { action: 'qr_generate', durationMinutes, expiresAt },
    req,
  });

  return { eventId, expiresAt, durationMinutes, token };
}

/** Compose the QR token: eventId:secret:expiry(ms). */
export function buildQrToken({ eventId, secret, expiresAt }) {
  return `${eventId}:${secret}:${expiresAt.getTime()}`;
}

/** Render the QR as a PNG buffer (used for export/PDF). */
export async function renderQrPng({ eventId, secret, expiresAt }) {
  return qrPngBuffer(buildQrToken({ eventId, secret, expiresAt }), { width: 320 });
}

/**
 * QR check-in (spec §10):
 * - validates the token (secret hash matches the event's current secret)
 * - rejects expired tokens
 * - prevents duplicate attendance (unique event+user)
 * - records check-in time + user id
 */
export async function checkIn({ qrToken, userId, req }) {
  const [eventId, secret, expiryMs] = String(qrToken).split(':');
  if (!eventId || !secret || !expiryMs || !/^[a-f\d]{24}$/i.test(eventId)) {
    throw badRequest('Invalid QR code', 'INVALID_QR');
  }

  const event = await Event.findById(eventId).select(EVENT_SELECT).catch(() => null);
  if (!event) throw notFound('Event not found', 'EVENT_NOT_FOUND');
  if (event.status !== 'published') throw badRequest('This event is not active', 'EVENT_NOT_ACTIVE');

  const expectedHash = crypto.createHash('sha256').update(secret).digest('hex');
  if (!event.qr?.secretHash || event.qr.secretHash !== expectedHash) {
    throw badRequest('This QR code is no longer valid — ask the organizer for a fresh one', 'INVALID_QR');
  }
  if (!event.qr.expiresAt || event.qr.expiresAt < new Date()) {
    throw badRequest('This QR code has expired — ask the organizer for a fresh one', 'QR_EXPIRED');
  }

  // Registration check: must be registered (or already attended — duplicate
  // detection then applies via the attendance record below).
  const registration = await EventRegistration.findOne({
    event: eventId,
    user: userId,
    status: { $in: ['registered', 'attended'] },
  });
  if (!registration) {
    throw badRequest('You must register for the event before checking in', 'NOT_REGISTERED');
  }

  let attendance = await Attendance.findOne({ event: eventId, user: userId });
  const now = new Date();

  if (attendance) {
    if (['present', 'late'].includes(attendance.status)) {
      throw conflict('Attendance already marked for this event', 'DUPLICATE_CHECKIN');
    }
    // Re-mark an absent/registered record — late if the event already started.
    attendance.status = isLateForEvent(event, now) ? 'late' : 'present';
    attendance.checkInTime = now;
    attendance.method = 'qr';
    attendance.registrationStatus = 'registered';
    await attendance.save();
  } else {
    attendance = await Attendance.create({
      event: eventId,
      user: userId,
      registrationStatus: 'registered',
      status: 'present',
      checkInTime: now,
      method: 'qr',
    });
  }

  await EventRegistration.updateOne({ _id: registration._id }, { $set: { status: 'attended', attendedAt: now } });
  await awardReputation({ userId, rule: 'event_participation' });
  await logAudit({
    action: 'attendance_modify',
    actorId: userId,
    targetType: 'attendance',
    targetId: attendance._id,
    details: { eventId, action: 'qr_checkin' },
    req,
  });

  return { attendance, event: { _id: event._id, title: event.title } };
}

/** Check-out (end time) — marks checkOutTime. */
export async function checkOut({ eventId, userId }) {
  const attendance = await Attendance.findOneAndUpdate(
    { event: eventId, user: userId, checkOutTime: null, status: { $in: ['present', 'late'] } },
    { $set: { checkOutTime: new Date() } },
    { new: true },
  );
  if (!attendance) throw notFound('No active check-in found for this event', 'NO_CHECKIN');
  return attendance;
}

/** Attendance list for an event (organizer/admin). */
export async function listEventAttendance({ eventId, userId, role }) {
  await assertCanManageEvent(eventId, { _id: userId, role });
  const items = await Attendance.find({ event: eventId }).sort({ checkInTime: 1 }).populate(USER_POPULATE).lean();
  return items;
}

/** Attendance summary (totals + percentage) for an event. */
export async function getEventSummary({ eventId, userId, role }) {
  await assertCanManageEvent(eventId, { _id: userId, role });

  const [event, attendance, registrations] = await Promise.all([
    Event.findById(eventId).select('title date startTime endTime registrationsCount').lean(),
    Attendance.find({ event: eventId }).lean(),
    EventRegistration.countDocuments({ event: eventId, status: 'registered' }),
  ]);

  const counts = { registered: 0, present: 0, absent: 0, late: 0 };
  for (const record of attendance) counts[record.status] += 1;

  const total = counts.present + counts.absent + counts.late;
  const attendancePercent = total > 0 ? Math.round((counts.present + counts.late) / total * 100) : 0;

  return {
    event: event ? { _id: event._id, title: event.title, date: event.date, startTime: event.startTime, endTime: event.endTime } : null,
    counts,
    totalParticipants: registrations + counts.present, // registered + manually marked
    attendancePercent,
  };
}

/** Manual attendance marking (organizer/admin). */
export async function markManual({ eventId, userId, role, data, req }) {
  await assertCanManageEvent(eventId, { _id: userId, role });

  const target = await User.findById(data.userId).select('_id');
  if (!target) throw notFound('User not found', 'USER_NOT_FOUND');

  const registration = await EventRegistration.findOne({ event: eventId, user: data.userId });
  const status = data.status;

  let attendance = await Attendance.findOne({ event: eventId, user: data.userId });
  const now = new Date();

  if (attendance) {
    attendance.status = status;
    if (status === 'present' || status === 'late') {
      attendance.checkInTime = attendance.checkInTime ?? now;
    }
    if (status === 'absent') attendance.checkInTime = null;
    attendance.note = data.note ?? attendance.note;
    attendance.method = 'manual';
    attendance.markedBy = userId;
    await attendance.save();
  } else {
    attendance = await Attendance.create({
      event: eventId,
      user: data.userId,
      registrationStatus: registration ? 'registered' : 'manual',
      status,
      checkInTime: status === 'present' || status === 'late' ? now : null,
      method: 'manual',
      markedBy: userId,
      note: data.note ?? '',
    });
  }

  await logAudit({
    action: 'attendance_modify',
    actorId: userId,
    targetType: 'attendance',
    targetId: attendance._id,
    details: { eventId, action: 'manual_mark', status },
    req,
  });

  if (status === 'present' || status === 'late') {
    await EventRegistration.updateOne({ _id: registration?._id }, { $set: { status: 'attended', attendedAt: now } });
  }

  return attendance;
}

/** Edit an attendance record (organizer/admin). */
export async function editAttendance({ eventId, attendanceId, userId, role, data, req }) {
  await assertCanManageEvent(eventId, { _id: userId, role });

  const attendance = await Attendance.findOneAndUpdate(
    { _id: attendanceId, event: eventId },
    { $set: { status: data.status, note: data.note ?? '' } },
    { new: true },
  );
  if (!attendance) throw notFound('Attendance record not found', 'ATTENDANCE_NOT_FOUND');

  await logAudit({
    action: 'attendance_modify',
    actorId: userId,
    targetType: 'attendance',
    targetId: attendance._id,
    details: { eventId, action: 'edit', status: data.status },
    req,
  });
  return attendance;
}

/** A user's own attendance history. */
export async function listMyAttendance({ userId }) {
  const items = await Attendance.find({ user: userId })
    .sort({ createdAt: -1 })
    .populate({ path: 'event', select: 'title date startTime endTime venue organizer', populate: ORGANIZER_POPULATE })
    .lean();
  return items;
}

/** Notify a user their check-in succeeded. */
export async function notifyCheckIn({ userId, eventTitle }) {
  await createNotification({
    recipientId: userId,
    type: 'event_registration',
    title: 'Check-in successful ✅',
    body: `Your attendance for "${eventTitle}" has been recorded.`,
    data: { url: '/attendance' },
  });
}

/** Late determination: check-in after event start time (+15 min grace). */
function isLateForEvent(event, now) {
  if (!event.startTime) return false;
  const [hours, minutes] = String(event.startTime).split(':').map(Number);
  if (Number.isNaN(hours)) return false;
  const eventDate = event.date ? new Date(event.date) : new Date();
  eventDate.setHours(hours, minutes, 0, 0);
  eventDate.setMinutes(eventDate.getMinutes() + 15); // 15-min grace period
  return now > eventDate;
}
