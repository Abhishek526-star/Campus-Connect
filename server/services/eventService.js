import Event from '../models/event.js';
import EventRegistration from '../models/eventRegistration.js';
import User from '../models/user.js';
import { badRequest, conflict, forbidden, notFound } from '../utils/ApiError.js';
import { paginationMeta } from '../utils/pagination.js';
import { createNotification } from './notificationService.js';
import { logAudit } from '../utils/audit.js';

const ORGANIZER_POPULATE = { path: 'organizer', select: 'name avatar role badges' };

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Is the user allowed to manage (edit/delete) this event? */
function canManage(event, user) {
  return user.role === 'admin' || String(event.organizer) === String(user._id);
}

/**
 * Event listing (spec §9) — filters: search, category, department, mode,
 * period (upcoming / past / all). Only published events for regular users;
 * organizers see their own in all statuses via listMyEvents.
 */
export async function listEvents({ filters = {}, page, limit, sort }) {
  const today = new Date();
  const query = { status: 'published' };

  if (filters.category) query.category = filters.category;
  if (filters.department) query.department = filters.department;
  if (filters.mode) query.mode = filters.mode;
  if (filters.search) query.title = { $regex: escapeRegExp(filters.search), $options: 'i' };
  if (filters.period === 'upcoming') query.date = { $gte: today };
  if (filters.period === 'past') query.date = { $lt: today };

  const sortOptions = {
    date: { date: 1 },
    '-date': { date: -1 },
    registrations: { registrationsCount: -1 },
    newest: { createdAt: -1 },
  }[sort] ?? { date: 1 };

  const [items, total] = await Promise.all([
    Event.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('title description date startTime endTime venue mode meetingLink maxParticipants registrationDeadline image department category status registrationsCount organizer')
      .populate(ORGANIZER_POPULATE)
      .lean(),
    Event.countDocuments(query),
  ]);

  return { items, meta: paginationMeta(total, page, limit) };
}

/** Single event + the viewer's registration state. */
export async function getEventById({ eventId, userId }) {
  const event = await Event.findById(eventId)
    .select('title description date startTime endTime venue mode meetingLink maxParticipants registrationDeadline image department category status registrationsCount organizer createdAt')
    .populate(ORGANIZER_POPULATE)
    .lean();
  if (!event) throw notFound('Event not found', 'EVENT_NOT_FOUND');

  const registration = userId
    ? await EventRegistration.findOne({ event: eventId, user: userId }).select('status attendedAt').lean()
    : null;

  return { event: { ...event, myRegistration: registration ?? null } };
}

/** Create an event (faculty/alumni/admin — spec §2, §21). */
export async function createEvent({ data, userId, role, req }) {
  if (!['faculty', 'alumni', 'admin'].includes(role)) {
    throw forbidden('Only faculty, alumni, and administrators can create events', 'EVENT_CREATE_FORBIDDEN');
  }

  const event = await Event.create({
    ...data,
    organizer: userId,
    status: data.status ?? 'published',
  });

  await logAudit({
    action: 'event_create',
    actorId: userId,
    targetType: 'event',
    targetId: event._id,
    details: { title: event.title },
    req,
  });

  return event;
}

/** Update an event (organizer or admin). */
export async function updateEvent({ eventId, data, userId, role, req }) {
  const event = await Event.findById(eventId);
  if (!event) throw notFound('Event not found', 'EVENT_NOT_FOUND');
  if (!canManage(event, { _id: userId, role })) throw forbidden('Only the organizer or an admin can edit this event', 'EVENT_UPDATE_FORBIDDEN');

  Object.assign(event, data);
  await event.save();

  await logAudit({
    action: 'event_update',
    actorId: userId,
    targetType: 'event',
    targetId: event._id,
    details: { title: event.title },
    req,
  });
  return event;
}

/** Delete an event (organizer or admin). */
export async function deleteEvent({ eventId, userId, role, req }) {
  const event = await Event.findById(eventId);
  if (!event) throw notFound('Event not found', 'EVENT_NOT_FOUND');
  if (!canManage(event, { _id: userId, role })) throw forbidden('Only the organizer or an admin can delete this event', 'EVENT_DELETE_FORBIDDEN');

  await EventRegistration.deleteMany({ event: eventId });
  await Event.deleteOne({ _id: eventId });

  await logAudit({
    action: 'event_delete',
    actorId: userId,
    targetType: 'event',
    targetId: eventId,
    details: { title: event.title },
    req,
  });
}

/** Register for an event (any authenticated user — spec §9). */
export async function registerForEvent({ eventId, userId }) {
  const event = await Event.findById(eventId);
  if (!event) throw notFound('Event not found', 'EVENT_NOT_FOUND');
  if (event.status !== 'published') throw badRequest('This event is not open for registration', 'EVENT_NOT_OPEN');

  if (event.registrationDeadline && event.registrationDeadline < new Date()) {
    throw badRequest('The registration deadline for this event has passed', 'REGISTRATION_CLOSED');
  }
  if (event.registrationsCount >= event.maxParticipants) {
    throw conflict('This event is full', 'EVENT_FULL');
  }

  let registration = await EventRegistration.findOne({ event: eventId, user: userId });
  if (registration) {
    if (registration.status === 'registered') {
      throw conflict('You are already registered for this event', 'ALREADY_REGISTERED');
    }
    // Re-activate a cancelled registration.
    registration.status = 'registered';
    registration.attendedAt = null;
    await registration.save();
    await Event.updateOne({ _id: eventId }, { $inc: { registrationsCount: 1 } });
  } else {
    await EventRegistration.create({ event: eventId, user: userId, status: 'registered' });
    await Event.updateOne({ _id: eventId }, { $inc: { registrationsCount: 1 } });
  }

  const user = await User.findById(userId).select('name role');
  await createNotification({
    recipientId: event.organizer,
    type: 'event_registration',
    title: 'New event registration',
    body: `${user?.name ?? 'Someone'} (${user?.role ?? 'member'}) registered for "${event.title}"`,
    data: { url: `/events/${eventId}`, eventId },
  });

  return { eventId, status: 'registered' };
}

/** Cancel a registration (spec §9 cancel registration). */
export async function cancelRegistration({ eventId, userId }) {
  const registration = await EventRegistration.findOne({ event: eventId, user: userId, status: 'registered' });
  if (!registration) throw notFound('Registration not found', 'REGISTRATION_NOT_FOUND');

  registration.status = 'cancelled';
  registration.attendedAt = null;
  await registration.save();

  await Event.updateOne(
    { _id: eventId, registrationsCount: { $gt: 0 } },
    { $inc: { registrationsCount: -1 } },
  );

  return { eventId, status: 'cancelled' };
}

/** Participant list with user details (organizer/admin only). */
export async function listParticipants({ eventId, userId, role }) {
  const event = await Event.findById(eventId);
  if (!event) throw notFound('Event not found', 'EVENT_NOT_FOUND');
  if (!canManage(event, { _id: userId, role })) {
    throw forbidden('Only the organizer or an admin can view participants', 'EVENT_PARTICIPANTS_FORBIDDEN');
  }

  const registrations = await EventRegistration.find({ event: eventId })
    .sort({ createdAt: 1 })
    .populate({ path: 'user', select: 'name email avatar role badges' })
    .lean();

  return registrations;
}

/** Events organized by the current user (any status) + their counts. */
export async function listMyEvents({ userId }) {
  const events = await Event.find({ organizer: userId })
    .sort({ date: -1 })
    .select('title date startTime endTime venue mode category status registrationsCount maxParticipants')
    .lean();

  return events;
}
