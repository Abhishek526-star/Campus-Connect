import Job from '../models/job.js';
import User from '../models/user.js';
import SavedItem from '../models/savedItem.js';
import Report from '../models/report.js';
import { badRequest, conflict, forbidden, notFound } from '../utils/ApiError.js';
import { paginationMeta } from '../utils/pagination.js';
import { createNotification } from './notificationService.js';
import { logAudit } from '../utils/audit.js';

const POSTER_POPULATE = { path: 'postedBy', select: 'name avatar role badges' };
const POSTER_ROLES = ['faculty', 'alumni', 'admin'];
const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Can this user manage (edit/delete) this job? */
function canManage(job, user) {
  return user.role === 'admin' || String(job.postedBy) === String(user._id);
}

/**
 * Opportunity board (spec §14): jobs, internships, freelance, hackathons,
 * competitions, training — with search + filters + pagination.
 */
export async function listJobs({ viewerId, filters = {}, page, limit, sort }) {
  const today = new Date();
  const query = {};

  // Moderation: everyone sees approved; admin can view pending/rejected; posters see their own.
  if (filters.includeAll === 'true') {
    query.status = { $in: ['approved', 'pending', 'rejected', 'closed'] };
    if (filters.postedByMe === 'true') query.postedBy = viewerId;
    else if (filters.status) query.status = filters.status;
    else query.postedBy = viewerId;
  } else {
    query.status = 'approved';
    query.$or = [{ deadline: null }, { deadline: { $gt: today } }];
    if (filters.postedByMe === 'true') query.postedBy = viewerId;
  }

  if (filters.type && filters.type !== 'all') query.type = filters.type;
  if (filters.workMode && filters.workMode !== 'all') query.workMode = filters.workMode;
  if (filters.location) query.location = { $regex: escapeRegExp(filters.location), $options: 'i' };
  if (filters.company) query.company = { $regex: escapeRegExp(filters.company), $options: 'i' };
  if (filters.skills?.length) query.skills = { $all: filters.skills };
  if (filters.experience) query.experience = { $regex: escapeRegExp(filters.experience), $options: 'i' };
  if (filters.search) {
    query.$and = [
      { $or: [{ title: { $regex: escapeRegExp(filters.search), $options: 'i' } }, { company: { $regex: escapeRegExp(filters.search), $options: 'i' } }] },
    ];
    if (query.$or) {
      // merge: search OR + deadline OR
      query.$and.push({ $or: query.$or });
      delete query.$or;
    }
  }

  const sortOptions = {
    newest: { createdAt: -1 },
    deadline: { deadline: 1 },
    '-deadline': { deadline: -1 },
    featured: { isFeatured: -1, createdAt: -1 },
    views: { views: -1 },
  }[sort] ?? { createdAt: -1 };

  const [items, total] = await Promise.all([
    Job.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('title company type description location workMode salary experience skills eligibility deadline applicationLink applyThroughPlatform postedBy status isFeatured views applicants createdAt')
      .populate(POSTER_POPULATE)
      .lean(),
    Job.countDocuments(query),
  ]);

  // Saved state for the viewer.
  let savedIds = new Set();
  if (viewerId) {
    const saved = await SavedItem.find({ user: viewerId, itemType: 'job' }).select('itemId').lean();
    savedIds = new Set(saved.map((s) => String(s.itemId)));
  }

  const enriched = items.map((job) => ({
    ...job,
    isSaved: savedIds.has(String(job._id)),
    applicantCount: job.applicants?.length ?? 0,
    hasApplied: viewerId ? (job.applicants ?? []).some((id) => String(id) === String(viewerId)) : false,
    applicants: undefined,
  }));

  return { items: enriched, meta: paginationMeta(total, page, limit) };
}

/** Single job + viewer state. */
export async function getJobById({ jobId, userId }) {
  const job = await Job.findByIdAndUpdate(jobId, { $inc: { views: 1 } }, { new: true })
    .populate(POSTER_POPULATE)
    .lean();
  if (!job) throw notFound('Opportunity not found', 'JOB_NOT_FOUND');
  if (job.status !== 'approved' && !canManage(job, { _id: userId, role: userId ? (await User.findById(userId).select('role').lean())?.role : 'student' })) {
    throw notFound('Opportunity not found', 'JOB_NOT_FOUND');
  }

  const [saved, applied] = await Promise.all([
    userId ? SavedItem.exists({ user: userId, itemType: 'job', itemId: jobId }) : false,
    userId ? (job.applicants ?? []).some((id) => String(id) === String(userId)) : false,
  ]);

  return { job: { ...job, isSaved: Boolean(saved), hasApplied: Boolean(applied), applicantCount: job.applicants?.length ?? 0, applicants: undefined } };
}

/** Create a job/opportunity (faculty/alumni/admin — spec §2, §21). */
export async function createJob({ data, userId, role, req }) {
  if (!POSTER_ROLES.includes(role)) {
    throw forbidden('Only faculty, alumni, and administrators can post opportunities', 'JOB_POST_FORBIDDEN');
  }

  const job = await Job.create({
    ...data,
    postedBy: userId,
    // Alumni/faculty posts go live immediately; admins can mark featured.
    status: data.status ?? 'approved',
  });

  await logAudit({
    action: 'job_moderate',
    actorId: userId,
    targetType: 'job',
    targetId: job._id,
    details: { action: 'create', title: job.title, company: job.company },
    req,
  });

  return job;
}

/** Update (owner or admin). */
export async function updateJob({ jobId, data, userId, role, req }) {
  const job = await Job.findById(jobId);
  if (!job) throw notFound('Opportunity not found', 'JOB_NOT_FOUND');
  if (!canManage(job, { _id: userId, role })) {
    throw forbidden('Only the poster or an admin can edit this opportunity', 'JOB_UPDATE_FORBIDDEN');
  }
  Object.assign(job, data);
  await job.save();
  await logAudit({
    action: 'job_moderate',
    actorId: userId,
    targetType: 'job',
    targetId: jobId,
    details: { action: 'update', title: job.title },
    req,
  });
  return job;
}

/** Delete (owner or admin). */
export async function deleteJob({ jobId, userId, role, req }) {
  const job = await Job.findById(jobId);
  if (!job) throw notFound('Opportunity not found', 'JOB_NOT_FOUND');
  if (!canManage(job, { _id: userId, role })) {
    throw forbidden('Only the poster or an admin can delete this opportunity', 'JOB_DELETE_FORBIDDEN');
  }
  await SavedItem.deleteMany({ itemType: 'job', itemId: jobId });
  await Job.deleteOne({ _id: jobId });
  await logAudit({
    action: 'job_moderate',
    actorId: userId,
    targetType: 'job',
    targetId: jobId,
    details: { action: 'delete', title: job.title },
    req,
  });
}

/** Save/bookmark (spec §14 save opportunity). */
export async function saveJob({ jobId, userId }) {
  const job = await Job.findById(jobId).select('_id');
  if (!job) throw notFound('Opportunity not found', 'JOB_NOT_FOUND');
  const saved = await SavedItem.findOneAndUpdate(
    { user: userId, itemType: 'job', itemId: jobId },
    { $setOnInsert: { user: userId, itemType: 'job', itemId: jobId } },
    { upsert: true, new: true },
  );
  await Job.updateOne({ _id: jobId }, { $inc: { savedCount: 1 } }).catch(() => {});
  return saved;
}

export async function unsaveJob({ jobId, userId }) {
  await SavedItem.deleteOne({ user: userId, itemType: 'job', itemId: jobId });
}

/** List the viewer's saved jobs. */
export async function listSavedJobs({ userId }) {
  const saved = await SavedItem.find({ user: userId, itemType: 'job' }).sort({ createdAt: -1 }).select('itemId').lean();
  const ids = saved.map((s) => s.itemId);
  if (ids.length === 0) return [];
  const jobs = await Job.find({ _id: { $in: ids }, status: 'approved' })
    .populate(POSTER_POPULATE)
    .lean();
  return jobs.map((job) => ({ ...job, isSaved: true, applicantCount: job.applicants?.length ?? 0, applicants: undefined }));
}

/**
 * Apply (spec §14): platform applications push the user to the applicants list
 * and notify the poster; external applications just open the link.
 */
export async function applyToJob({ jobId, userId }) {
  const job = await Job.findById(jobId);
  if (!job) throw notFound('Opportunity not found', 'JOB_NOT_FOUND');
  if (job.status !== 'approved') throw badRequest('This opportunity is closed', 'JOB_CLOSED');
  if (job.deadline && job.deadline < new Date()) throw badRequest('The application deadline has passed', 'APPLICATION_CLOSED');

  if ((job.applicants ?? []).some((id) => String(id) === String(userId))) {
    throw conflict('You have already applied for this opportunity', 'ALREADY_APPLIED');
  }

  if (job.applyThroughPlatform) {
    job.applicants.push(userId);
    await job.save();

    const applicant = await User.findById(userId).select('name role');
    await createNotification({
      recipientId: job.postedBy,
      type: 'new_job',
      title: 'New application received',
      body: `${applicant?.name ?? 'Someone'} applied for "${job.title}"`,
      data: { url: `/opportunities/${jobId}`, jobId },
    });
    return { applied: true, external: false, jobId };
  }

  return { applied: false, external: true, jobId, applicationLink: job.applicationLink };
}

/** Report an opportunity (spec §14 report). */
export async function reportJob({ jobId, userId, reason, details }) {
  const job = await Job.findById(jobId).select('_id');
  if (!job) throw notFound('Opportunity not found', 'JOB_NOT_FOUND');
  const existing = await Report.findOne({ reporter: userId, targetType: 'job', targetId: jobId, status: 'pending' });
  if (existing) throw conflict('You have already reported this opportunity', 'ALREADY_REPORTED');
  await Report.create({ reporter: userId, targetType: 'job', targetId: jobId, reason, details });
}

/** Admin moderation (spec §14, §20): approve/reject/close + notify poster. */
export async function moderateJob({ jobId, status, userId, role, req }) {
  if (role !== 'admin') throw forbidden('Only administrators can moderate opportunities', 'MODERATE_FORBIDDEN');
  const job = await Job.findById(jobId);
  if (!job) throw notFound('Opportunity not found', 'JOB_NOT_FOUND');

  job.status = status;
  await job.save();

  await createNotification({
    recipientId: job.postedBy,
    type: 'job_status',
    title: `Opportunity ${status}`,
    body: `"${job.title}" was ${status} by a moderator`,
    data: { url: `/opportunities/${jobId}`, jobId },
  });

  await logAudit({
    action: 'job_moderate',
    actorId: userId,
    targetType: 'job',
    targetId: jobId,
    details: { action: 'moderate', status },
    req,
  });
  return job;
}
