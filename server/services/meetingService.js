import Meeting from '../models/meeting.js';
import MeetingParticipant from '../models/meetingParticipant.js';
import User from '../models/user.js';
import { badRequest, forbidden, notFound } from '../utils/ApiError.js';
import { paginationMeta } from '../utils/pagination.js';
import { createNotification } from './notificationService.js';
import { logAudit } from '../utils/audit.js';

const ORGANIZER_POPULATE = { path: 'organizer', select: 'name avatar role badges' };

/**
 * Meetings module (spec §8).
 * Statuses: scheduled · pending · accepted · rejected · completed · cancelled.
 * Participants: invited · accepted · rejected.
 */

/** Create a meeting with participant invites + notifications. */
export async function createMeeting({ data, userId, req }) {
  const meeting = await Meeting.create({
    title: data.title,
    organizer: userId,
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime ?? '',
    type: data.type ?? 'one_on_one',
    description: data.description ?? '',
    location: data.location ?? '',
    meetingLink: data.meetingLink ?? '',
    status: 'scheduled',
  });

  // Unique participant ids, excluding the organizer.
  const participantIds = [...new Set(data.participantIds.map(String))].filter((id) => id !== String(userId));

  const validUsers = await User.find({ _id: { $in: participantIds }, isActive: true, isApproved: true })
    .select('_id name email')
    .lean();

  const validIds = validUsers.map((user) => user._id);
  if (validIds.length === 0) {
    await Meeting.deleteOne({ _id: meeting._id });
    throw badRequest('No valid participants selected', 'NO_VALID_PARTICIPANTS');
  }

  await MeetingParticipant.insertMany(validIds.map((id) => ({ meeting: meeting._id, user: id, status: 'invited' })));

  // Notify each invitee.
  const organizer = await User.findById(userId).select('name');
  await Promise.all(
    validIds.map((participantId) =>
      createNotification({
        recipientId: participantId,
        type: 'meeting_invitation',
        title: 'Meeting invitation',
        body: `${organizer?.name ?? 'Someone'} invited you to "${meeting.title}" on ${new Date(meeting.date).toLocaleDateString('en-IN')} at ${meeting.startTime}`,
        data: { url: `/meetings/${meeting._id}`, meetingId: meeting._id },
      }),
    ),
  );

  await logAudit({
    action: 'meeting_create',
    actorId: userId,
    targetType: 'meeting',
    targetId: meeting._id,
    details: { title: meeting.title, participants: validIds.length },
    req,
  });

  return { meeting: await Meeting.populate(meeting, ORGANIZER_POPULATE), participantCount: validIds.length };
}

/** List meetings where the user is organizer or participant. */
export async function listMeetings({ userId, status, page, limit }) {
  const participations = await MeetingParticipant.find({ user: userId }).select('meeting').lean();
  const participantIds = participations.map((p) => p.meeting);

  const query = {
    $or: [{ organizer: userId }, { _id: { $in: participantIds } }],
  };
  if (status && ['scheduled', 'pending', 'accepted', 'rejected', 'completed', 'cancelled'].includes(status)) {
    query.status = status;
  }

  const [items, total] = await Promise.all([
    Meeting.find(query)
      .sort({ date: -1, startTime: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('title organizer date startTime endTime type description location meetingLink status')
      .populate(ORGANIZER_POPULATE)
      .lean(),
    Meeting.countDocuments(query),
  ]);

  // Add my participant status + participant list per meeting.
  const result = await Promise.all(
    items.map(async (meeting) => {
      const myParticipation = await MeetingParticipant.findOne({ meeting: meeting._id, user: userId })
        .select('status')
        .lean();
      const participants = await MeetingParticipant.find({ meeting: meeting._id })
        .populate({ path: 'user', select: 'name avatar role' })
        .select('user status')
        .lean();
      return { ...meeting, myStatus: myParticipation?.status ?? 'organizer', participants };
    }),
  );

  return { items: result, meta: paginationMeta(total, page, limit) };
}

/** Single meeting + my status + participant list. */
export async function getMeetingById({ meetingId, userId }) {
  const meeting = await Meeting.findById(meetingId)
    .select('title organizer date startTime endTime type description location meetingLink status createdAt')
    .populate(ORGANIZER_POPULATE)
    .lean();
  if (!meeting) throw notFound('Meeting not found', 'MEETING_NOT_FOUND');

  const isOrganizer = String(meeting.organizer._id) === String(userId);
  if (!isOrganizer) {
    const participation = await MeetingParticipant.exists({ meeting: meetingId, user: userId });
    if (!participation) throw forbidden('You are not part of this meeting', 'MEETING_NOT_MEMBER');
  }

  const participants = await MeetingParticipant.find({ meeting: meetingId })
    .populate({ path: 'user', select: 'name avatar role badges' })
    .select('user status respondedAt')
    .lean();

  const myParticipation = participants.find((p) => String(p.user._id) === String(userId)) ?? null;

  return { meeting: { ...meeting, isOrganizer }, participants, myStatus: myParticipation?.status ?? (isOrganizer ? 'organizer' : null) };
}

/** Organizer update / reschedule / add link. */
export async function updateMeeting({ meetingId, data, userId, role, req }) {
  const meeting = await Meeting.findById(meetingId);
  if (!meeting) throw notFound('Meeting not found', 'MEETING_NOT_FOUND');
  if (role !== 'admin' && String(meeting.organizer) !== String(userId)) {
    throw forbidden('Only the organizer can update this meeting', 'MEETING_UPDATE_FORBIDDEN');
  }
  if (meeting.status === 'cancelled' || meeting.status === 'completed') {
    throw badRequest('This meeting is already closed', 'MEETING_CLOSED');
  }

  const wasRescheduled =
    data.date || data.startTime || data.endTime
      ? String(data.date ?? meeting.date) !== String(meeting.date) ||
        (data.startTime ?? meeting.startTime) !== meeting.startTime ||
        (data.endTime ?? meeting.endTime) !== meeting.endTime
      : false;

  Object.assign(meeting, data);
  await meeting.save();

  if (wasRescheduled) {
    // Re-open pending responses and notify participants of the new time.
    await MeetingParticipant.updateMany(
      { meeting: meetingId, user: { $ne: userId } },
      { $set: { status: 'invited', respondedAt: null } },
    );
    meeting.status = 'scheduled';
    await meeting.save();

    const participants = await MeetingParticipant.find({ meeting: meetingId, user: { $ne: userId } })
      .select('user')
      .lean();
    await Promise.all(
      participants.map((p) =>
        createNotification({
          recipientId: p.user,
          type: 'meeting_invitation',
          title: 'Meeting rescheduled',
          body: `"${meeting.title}" moved to ${new Date(meeting.date).toLocaleDateString('en-IN')} at ${meeting.startTime}`,
          data: { url: `/meetings/${meetingId}`, meetingId },
        }),
      ),
    );
  }

  await logAudit({
    action: 'meeting_update',
    actorId: userId,
    targetType: 'meeting',
    targetId: meeting._id,
    details: { title: meeting.title, rescheduled: wasRescheduled },
    req,
  });

  return meeting;
}

/** Participant accepts/rejects an invitation. */
export async function respondToMeeting({ meetingId, userId, status, req }) {
  const meeting = await Meeting.findById(meetingId).select('title date startTime organizer status');
  if (!meeting) throw notFound('Meeting not found', 'MEETING_NOT_FOUND');
  if (meeting.status === 'cancelled' || meeting.status === 'completed') {
    throw badRequest('This meeting is already closed', 'MEETING_CLOSED');
  }

  const participation = await MeetingParticipant.findOne({ meeting: meetingId, user: userId });
  if (!participation) throw forbidden('You are not part of this meeting', 'MEETING_NOT_MEMBER');

  participation.status = status;
  participation.respondedAt = new Date();
  await participation.save();

  const user = await User.findById(userId).select('name');
  await createNotification({
    recipientId: meeting.organizer,
    type: 'meeting_invitation',
    title: `Invitation ${status}`,
    body: `${user?.name ?? 'Someone'} ${status} the invitation to "${meeting.title}"`,
    data: { url: `/meetings/${meetingId}`, meetingId },
  });

  await logAudit({
    action: 'meeting_update',
    actorId: userId,
    targetType: 'meeting',
    targetId: meetingId,
    details: { action: 'respond', status },
    req,
  });

  return participation;
}

/** Organizer: cancel or complete a meeting. */
export async function organizerSetStatus({ meetingId, userId, role, status, req }) {
  const meeting = await Meeting.findById(meetingId);
  if (!meeting) throw notFound('Meeting not found', 'MEETING_NOT_FOUND');
  if (role !== 'admin' && String(meeting.organizer) !== String(userId)) {
    throw forbidden('Only the organizer can change the meeting status', 'MEETING_UPDATE_FORBIDDEN');
  }

  meeting.status = status;
  await meeting.save();

  const participants = await MeetingParticipant.find({ meeting: meetingId }).select('user').lean();
  await Promise.all(
    participants.map((p) =>
      createNotification({
        recipientId: p.user,
        type: 'meeting_invitation',
        title: `Meeting ${status}`,
        body: `"${meeting.title}" has been ${status} by the organizer`,
        data: { url: `/meetings/${meetingId}`, meetingId },
      }),
    ),
  );

  await logAudit({
    action: 'meeting_update',
    actorId: userId,
    targetType: 'meeting',
    targetId: meetingId,
    details: { action: 'status_change', status },
    req,
  });

  return meeting;
}

/** Delete a meeting (organizer/admin). */
export async function deleteMeeting({ meetingId, userId, role, req }) {
  const meeting = await Meeting.findById(meetingId);
  if (!meeting) throw notFound('Meeting not found', 'MEETING_NOT_FOUND');
  if (role !== 'admin' && String(meeting.organizer) !== String(userId)) {
    throw forbidden('Only the organizer can delete this meeting', 'MEETING_DELETE_FORBIDDEN');
  }

  await MeetingParticipant.deleteMany({ meeting: meetingId });
  await Meeting.deleteOne({ _id: meetingId });

  await logAudit({
    action: 'meeting_delete',
    actorId: userId,
    targetType: 'meeting',
    targetId: meetingId,
    details: { title: meeting.title },
    req,
  });
}

/** Send reminders to all participants + organizer (spec §8 reminders). */
export async function sendReminder({ meetingId, userId, role, req }) {
  const meeting = await Meeting.findById(meetingId).select('title date startTime organizer');
  if (!meeting) throw notFound('Meeting not found', 'MEETING_NOT_FOUND');
  if (role !== 'admin' && String(meeting.organizer) !== String(userId)) {
    throw forbidden('Only the organizer can send reminders', 'MEETING_UPDATE_FORBIDDEN');
  }

  const participants = await MeetingParticipant.find({ meeting: meetingId }).select('user').lean();
  const recipientIds = [...new Set([meeting.organizer, ...participants.map((p) => p.user)])];

  await Promise.all(
    recipientIds.map((recipientId) =>
      createNotification({
        recipientId,
        type: 'meeting_reminder',
        title: 'Meeting reminder',
        body: `"${meeting.title}" is on ${new Date(meeting.date).toLocaleDateString('en-IN')} at ${meeting.startTime}. Don't be late!`,
        data: { url: `/meetings/${meetingId}`, meetingId },
      }),
    ),
  );

  await logAudit({
    action: 'meeting_update',
    actorId: userId,
    targetType: 'meeting',
    targetId: meetingId,
    details: { action: 'reminder', recipients: recipientIds.length },
    req,
  });

  return { reminded: recipientIds.length };
}
