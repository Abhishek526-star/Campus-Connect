import User from '../models/user.js';
import StudentProfile from '../models/studentProfile.js';
import FacultyProfile from '../models/facultyProfile.js';
import AlumniProfile from '../models/alumniProfile.js';
import Event from '../models/event.js';
import Meeting from '../models/meeting.js';
import Scholarship from '../models/scholarship.js';
import Donation from '../models/donation.js';
import Job from '../models/job.js';
import Resource from '../models/resource.js';
import Post from '../models/post.js';
import Attendance from '../models/attendance.js';
import Report from '../models/report.js';
import { badRequest, notFound } from '../utils/ApiError.js';
import { paginationMeta } from '../utils/pagination.js';
import { createNotification } from './notificationService.js';
import { logAudit } from '../utils/audit.js';

const PROFILE_MODELS = { student: StudentProfile, faculty: FacultyProfile, alumni: AlumniProfile };
const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** KPI cards (spec §20). */
export async function getStats() {
  const [
    totalUsers, students, faculty, alumni, activeUsers, pendingRegistrations,
    events, upcomingEvents, meetings, scholarships, donations, jobs, internships, resources,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'faculty' }),
    User.countDocuments({ role: 'alumni' }),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ isApproved: false, isVerified: true }),
    Event.countDocuments({}),
    Event.countDocuments({ status: 'published', date: { $gte: new Date() } }),
    Meeting.countDocuments({}),
    Scholarship.countDocuments({}),
    Donation.countDocuments({ status: 'paid' }),
    Job.countDocuments({ type: 'job' }),
    Job.countDocuments({ type: 'internship' }),
    Resource.countDocuments({}),
  ]);

  return {
    totalUsers, students, faculty, alumni, activeUsers, pendingRegistrations,
    events, upcomingEvents, meetings, scholarships, donations, jobs, internships, resources,
  };
}

/** Analytics chart datasets (spec §20). */
export async function getAnalytics() {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { start: d, label: d.toLocaleString('en-IN', { month: 'short' }) };
  });

  const userGrowth = [];
  for (const month of months) {
    const next = new Date(month.start.getFullYear(), month.start.getMonth() + 1, 1);
    const count = await User.countDocuments({ createdAt: { $gte: month.start, $lt: next } });
    userGrowth.push({ month: month.label, users: count });
  }

  const roleDistribution = await Promise.all(
    ['student', 'faculty', 'alumni', 'admin'].map(async (role) => ({
      name: role,
      value: await User.countDocuments({ role }),
    })),
  );

  const eventParticipation = await Event.find({}).select('title registrationsCount').sort({ date: -1 }).limit(6).lean();
  const attendanceTrend = await (async () => {
    const events = await Event.find({ status: { $in: ['published', 'completed'] } }).select('date').sort({ date: -1 }).limit(6).lean();
    const rows = [];
    for (const event of events) {
      const present = await Attendance.countDocuments({ event: event._id, status: { $in: ['present', 'late'] } });
      rows.push({ event: String(event.date).slice(0, 10), present });
    }
    return rows;
  })();

  const scholarshipFunding = await Scholarship.find({})
    .select('name raisedAmount targetAmount')
    .sort({ raisedAmount: -1 })
    .limit(6)
    .lean();

  const jobPostings = await Job.aggregate([
    { $match: { type: 'job' } },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $limit: 6 },
  ]);
  const internshipPostings = await Job.aggregate([
    { $match: { type: 'internship' } },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $limit: 6 },
  ]);

  return {
    userGrowth,
    roleDistribution,
    eventParticipation: eventParticipation.map((e) => ({ name: e.title.slice(0, 18), registrations: e.registrationsCount })),
    attendanceTrend,
    scholarshipFunding: scholarshipFunding.map((s) => ({ name: s.name.slice(0, 16), raised: s.raisedAmount, target: s.targetAmount })),
    jobPostings: jobPostings.map((j) => ({ month: j._id, jobs: j.count })),
    internshipPostings: internshipPostings.map((j) => ({ month: j._id, internships: j.count })),
  };
}

/** User management list (spec §20): search/filter/paginate. */
export async function listUsers({ filters = {}, page, limit }) {
  const query = {};
  if (filters.role && filters.role !== 'all') query.role = filters.role;
  if (filters.status === 'pending') query.isApproved = false;
  if (filters.status === 'active') query.isActive = true;
  if (filters.status === 'disabled') query.isActive = false;
  if (filters.search) query.name = { $regex: escapeRegExp(filters.search), $options: 'i' };

  const [items, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('name email role avatar isVerified isApproved isActive badges reputationScore lastLoginAt createdAt')
      .lean(),
    User.countDocuments(query),
  ]);

  const enriched = await Promise.all(
    items.map(async (user) => {
      const profile = PROFILE_MODELS[user.role]
        ? await PROFILE_MODELS[user.role].findOne({ user: user._id })
            .select('department designation currentCompany graduationYear')
            .lean()
        : null;
      return { ...user, profile };
    }),
  );

  return { items: enriched, meta: paginationMeta(total, page, limit) };
}

/** Admin edits a user: verify, approve, activate/deactivate, role, badges. */
export async function updateUser({ userId, actorId, data, req }) {
  const user = await User.findById(userId);
  if (!user) throw notFound('User not found', 'USER_NOT_FOUND');
  if (String(userId) === String(actorId) && (data.role || data.isActive === false)) {
    throw badRequest('You cannot change your own role or deactivate yourself', 'SELF_EDIT_FORBIDDEN');
  }

  const changes = {};
  if (data.role && data.role !== user.role) {
    if (data.role === 'admin') throw badRequest('Role changes to admin are not allowed', 'ROLE_CHANGE_FORBIDDEN');
    changes.role = data.role;
  }
  if (typeof data.isVerified === 'boolean') changes.isVerified = data.isVerified;
  if (typeof data.isApproved === 'boolean') changes.isApproved = data.isApproved;
  if (typeof data.isActive === 'boolean') changes.isActive = data.isActive;
  if (Array.isArray(data.badges)) changes.badges = data.badges;
  if (typeof data.name === 'string' && data.name.trim().length >= 2) changes.name = data.name.trim();

  if (Object.keys(changes).length === 0) throw badRequest('No updatable fields provided', 'NOTHING_TO_UPDATE');

  Object.assign(user, changes);
  await user.save();

  // Notify the affected user of approval status.
  if (changes.isApproved === true) {
    await createNotification({
      recipientId: userId,
      type: 'account_approved',
      title: 'Account approved ✅',
      body: 'Your account has been approved. You can now log in.',
      data: { url: '/dashboard' },
    });
  }
  if (changes.isApproved === false) {
    await createNotification({
      recipientId: userId,
      type: 'account_rejected',
      title: 'Registration declined',
      body: 'Your registration was not approved. Contact the administrator.',
      data: { url: '/login' },
    });
  }
  if (changes.isActive === false) {
    await createNotification({
      recipientId: userId,
      type: 'account_rejected',
      title: 'Account deactivated',
      body: 'Your account has been deactivated by an administrator.',
      data: { url: '/login' },
    });
  }

  await logAudit({
    action: changes.role ? 'role_change' : 'admin_action',
    actorId,
    targetType: 'user',
    targetId: userId,
    details: { changes },
    req,
  });

  return user;
}

/** Admin deletes a user (soft: deactivate + anonymize). */
export async function deleteUser({ userId, actorId, req }) {
  const user = await User.findById(userId);
  if (!user) throw notFound('User not found', 'USER_NOT_FOUND');
  if (String(userId) === String(actorId)) throw badRequest('You cannot delete your own account here', 'SELF_DELETE_FORBIDDEN');

  // Soft-delete: deactivate + anonymize to preserve data integrity.
  user.isActive = false;
  user.isApproved = false;
  user.email = `deleted-${user._id}@campus.edu`;
  user.name = 'Deleted User';
  await user.save();

  await logAudit({
    action: 'account_delete',
    actorId,
    targetType: 'user',
    targetId: userId,
    details: { soft: true },
    req,
  });
}

/** Content moderation queue counts (posts/jobs/resources/reports). */
export async function getModerationQueue() {
  const [pendingPosts, pendingJobs, pendingResources, pendingReports] = await Promise.all([
    Post.countDocuments({ status: 'published' }),
    Job.countDocuments({ status: 'pending' }),
    Resource.countDocuments({ status: 'pending' }),
    Report.countDocuments({ status: 'pending' }),
  ]);
  return { pendingPosts, pendingJobs, pendingResources, pendingReports };
}
