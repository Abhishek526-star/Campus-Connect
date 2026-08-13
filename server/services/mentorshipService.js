import Mentorship from '../models/mentorship.js';
import MentorshipSession from '../models/mentorshipSession.js';
import Referral from '../models/referral.js';
import User from '../models/user.js';
import AlumniProfile from '../models/alumniProfile.js';
import Job from '../models/job.js';
import { badRequest, conflict, forbidden, notFound } from '../utils/ApiError.js';
import { paginationMeta } from '../utils/pagination.js';
import { createNotification } from './notificationService.js';
import { awardReputation } from './certificateService.js';
import { logAudit } from '../utils/audit.js';

const MENTORSHIP_AREAS = ['dsa', 'web_development', 'ai_ml', 'cloud', 'devops', 'career', 'interview_preparation', 'higher_studies'];

/**
 * Mentorship (spec §29): alumni offer mentorship in 8 areas; students
 * request; sessions schedule against the Meetings module.
 */

/** Alumni offering mentorship, filterable by area (spec §29 alumni directory). */
export async function listMentors({ area, page, limit }) {
  const profileQuery = { availableForMentorship: true };
  if (area) profileQuery.mentorshipAreas = area;

  const profiles = await AlumniProfile.find(profileQuery)
    .select('user currentCompany designation skills mentorshipAreas location')
    .lean();

  const userIds = profiles.map((profile) => profile.user);
  if (userIds.length === 0) return { items: [], meta: paginationMeta(0, page, limit) };

  const [users, total] = await Promise.all([
    User.find({ _id: { $in: userIds }, isActive: true, isApproved: true })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('name avatar role badges reputationScore')
      .lean(),
    User.countDocuments({ _id: { $in: userIds }, isActive: true, isApproved: true }),
  ]);

  const enriched = users.map((user) => {
    const profile = profiles.find((p) => String(p.user) === String(user._id));
    return { ...user, profile };
  });

  return { items: enriched, meta: paginationMeta(total, page, limit) };
}

/** Request mentorship (student → alumni). */
export async function requestMentorship({ mentorId, studentId, area, message, goals }) {
  if (String(mentorId) === String(studentId)) throw badRequest('You cannot mentor yourself', 'SELF_MENTORSHIP');
  if (!MENTORSHIP_AREAS.includes(area)) throw badRequest('Invalid mentorship area', 'INVALID_AREA');

  const [mentor, student] = await Promise.all([
    User.findById(mentorId).select('role name'),
    User.findById(studentId).select('role name'),
  ]);
  if (!mentor || !student) throw notFound('User not found', 'USER_NOT_FOUND');
  if (mentor.role !== 'alumni' && mentor.role !== 'faculty') {
    throw forbidden('Only alumni and faculty can mentor', 'MENTOR_ROLE_FORBIDDEN');
  }
  if (student.role !== 'student') throw forbidden('Only students can request mentorship', 'STUDENT_ONLY');

  const existing = await Mentorship.findOne({ mentor: mentorId, student: studentId, area });
  if (existing && existing.status !== 'rejected' && existing.status !== 'cancelled') {
    throw conflict('A mentorship request already exists for this area', 'ALREADY_REQUESTED');
  }

  const mentorship = existing
    ? Object.assign(existing, { status: 'requested', message: message ?? '', goals: goals ?? [] })
    : await Mentorship.create({ mentor: mentorId, student: studentId, area, message: message ?? '', goals: goals ?? [] });
  if (!existing) await mentorship.save();

  await createNotification({
    recipientId: mentorId,
    type: 'mentorship_request',
    title: 'Mentorship request',
    body: `${student.name} requested mentorship in ${area.replace('_', ' ')}`,
    data: { url: '/mentorship/requests', mentorshipId: mentorship._id },
  });

  return mentorship;
}

/** List mentorships involving the user (as mentor or student). */
export async function listMyMentorships({ userId }) {
  const items = await Mentorship.find({ $or: [{ mentor: userId }, { student: userId }] })
    .sort({ createdAt: -1 })
    .populate({ path: 'mentor', select: 'name avatar role' })
    .populate({ path: 'student', select: 'name avatar role' })
    .lean();
  return items;
}

/** Accept/reject/complete/cancel a mentorship (mentor for accept; either may cancel). */
export async function updateMentorshipStatus({ mentorshipId, userId, status, req }) {
  const mentorship = await Mentorship.findById(mentorshipId);
  if (!mentorship) throw notFound('Mentorship not found', 'MENTORSHIP_NOT_FOUND');

  const isMentor = String(mentorship.mentor) === String(userId);
  const isStudent = String(mentorship.student) === String(userId);
  if (!isMentor && !isStudent) throw forbidden('You are not part of this mentorship', 'MENTORSHIP_FORBIDDEN');

  const allowed = {
    requested: ['accepted', 'cancelled'],
    accepted: ['completed', 'cancelled'],
    completed: [],
    rejected: [],
    cancelled: [],
  }[mentorship.status] ?? [];

  if (!allowed.includes(status)) {
    throw badRequest(`Cannot move from "${mentorship.status}" to "${status}"`, 'INVALID_TRANSITION');
  }
  if ((status === 'accepted' || status === 'completed') && !isMentor) {
    throw forbidden('Only the mentor can accept or complete mentorship', 'MENTOR_ONLY');
  }

  mentorship.status = status;
  await mentorship.save();

  if (status === 'completed') {
    await awardReputation({ userId: mentorship.mentor, rule: 'mentorship_completed' });
  }

  if (status === 'accepted') {
    const mentor = await User.findById(mentorIdFor(mentorship)).select('name');
    await createNotification({
      recipientId: mentorship.student,
      type: 'mentorship_accepted',
      title: 'Mentorship accepted 🎉',
      body: `${mentor?.name ?? 'Your mentor'} accepted your mentorship request`,
      data: { url: '/mentorship', mentorshipId },
    });
  }

  await logAudit({
    action: 'meeting_create',
    actorId: userId,
    targetType: 'mentorship',
    targetId: mentorshipId,
    details: { action: 'status_change', status },
    req,
  });
  return mentorship;
}

function mentorIdFor(mentorship) {
  return mentorship.mentor;
}

/** Schedule a session against a Meeting. */
export async function addSession({ mentorshipId, userId, scheduledAt, notes }) {
  const mentorship = await Mentorship.findById(mentorshipId);
  if (!mentorship) throw notFound('Mentorship not found', 'MENTORSHIP_NOT_FOUND');
  const isMentor = String(mentorship.mentor) === String(userId);
  const isStudent = String(mentorship.student) === String(userId);
  if (!isMentor && !isStudent) throw forbidden('You are not part of this mentorship', 'MENTORSHIP_FORBIDDEN');

  const session = await MentorshipSession.create({ mentorship: mentorshipId, scheduledAt, notes: notes ?? '' });
  return session;
}

/** List sessions for a mentorship. */
export async function listSessions({ mentorshipId, userId }) {
  const mentorship = await Mentorship.findById(mentorshipId);
  if (!mentorship) throw notFound('Mentorship not found', 'MENTORSHIP_NOT_FOUND');
  const isMentor = String(mentorship.mentor) === String(userId);
  const isStudent = String(mentorship.student) === String(userId);
  if (!isMentor && !isStudent) throw forbidden('You are not part of this mentorship', 'MENTORSHIP_FORBIDDEN');

  const items = await MentorshipSession.find({ mentorship: mentorshipId }).sort({ scheduledAt: -1 }).lean();
  return items;
}

/* ---------------------------------------------------------------------------
 * Referrals (spec §29): alumni offer "I can refer students"; students request.
 * ------------------------------------------------------------------------- */

/** Alumni offers a referral for a job. */
export async function createReferralOffer({ alumnusId, jobId, note }) {
  const job = await Job.findById(jobId).select('title company');
  if (!job) throw notFound('Opportunity not found', 'JOB_NOT_FOUND');

  const existing = await Referral.findOne({ alumnus: alumnusId, job: jobId, student: null });
  if (existing) throw conflict('You already offered a referral for this opportunity', 'ALREADY_OFFERED');

  return Referral.create({ alumnus: alumnusId, job: jobId, note: note ?? '', status: 'requested' });
}

/** List referral offers (alumni view) + my requests (student view). */
export async function listReferrals({ userId, role }) {
  const query = role === 'alumni' || role === 'faculty' || role === 'admin' ? { alumnus: userId } : { student: userId };
  const items = await Referral.find(query)
    .sort({ createdAt: -1 })
    .populate({ path: 'job', select: 'title company location' })
    .populate({ path: 'alumnus', select: 'name avatar' })
    .populate({ path: 'student', select: 'name avatar' })
    .lean();
  return items;
}

/** Open referral offers (jobs where alumni said they can refer) for students. */
export async function listOpenReferralOffers({ page, limit }) {
  const query = { student: null, status: 'requested' };
  const [items, total] = await Promise.all([
    Referral.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({ path: 'job', select: 'title company location' })
      .populate({ path: 'alumnus', select: 'name avatar role badges' })
      .lean(),
    Referral.countDocuments(query),
  ]);
  return { items, meta: paginationMeta(total, page, limit) };
}

/** Student requests a referral offer. */
export async function requestReferral({ referralId, studentId }) {
  const referral = await Referral.findById(referralId);
  if (!referral) throw notFound('Referral not found', 'REFERRAL_NOT_FOUND');
  if (referral.student) throw conflict('This referral has already been claimed', 'ALREADY_CLAIMED');

  referral.student = studentId;
  await referral.save();

  const student = await User.findById(studentId).select('name');
  await createNotification({
    recipientId: referral.alumnus,
    type: 'referral_request',
    title: 'Referral requested',
    body: `${student?.name ?? 'A student'} requested your referral`,
    data: { url: '/mentorship', referralId },
  });

  return referral;
}

/** Alumni grants (marks given) a referral. */
export async function grantReferral({ referralId, alumnusId }) {
  const referral = await Referral.findById(referralId);
  if (!referral) throw notFound('Referral not found', 'REFERRAL_NOT_FOUND');
  if (String(referral.alumnus) !== String(alumnusId)) {
    throw forbidden('Only the offering alumnus can grant this referral', 'REFERRAL_FORBIDDEN');
  }
  if (!referral.student) throw badRequest('No student has requested this referral yet', 'NO_STUDENT');

  referral.status = 'given';
  await referral.save();

  await createNotification({
    recipientId: referral.student,
    type: 'referral_request',
    title: 'Referral given 🎉',
    body: 'Your referral has been given — check your messages for next steps',
    data: { url: '/mentorship', referralId },
  });

  return referral;
}
