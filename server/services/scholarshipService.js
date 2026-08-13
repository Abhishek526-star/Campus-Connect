import Scholarship from '../models/scholarship.js';
import ScholarshipApplication from '../models/scholarshipApplication.js';
import User from '../models/user.js';
import { badRequest, conflict, forbidden, notFound } from '../utils/ApiError.js';
import { paginationMeta } from '../utils/pagination.js';
import { createNotification } from './notificationService.js';
import { logAudit } from '../utils/audit.js';

const SPONSOR_POPULATE = { path: 'sponsor', select: 'name avatar role badges' };
const REVIEWER_ROLES = ['faculty', 'alumni', 'admin'];

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Scholarship campaigns (spec §11) — active ones for applicants. */
export async function listScholarships({ filters = {}, page, limit, sort }) {
  const query = {};
  if (filters.status) query.status = filters.status;
  else query.status = 'active';
  if (filters.category) query.category = filters.category;
  if (filters.search) query.name = { $regex: escapeRegExp(filters.search), $options: 'i' };

  const sortOptions = {
    deadline: { deadline: 1 },
    '-deadline': { deadline: -1 },
    amount: { amount: -1 },
    newest: { createdAt: -1 },
  }[sort] ?? { createdAt: -1 };

  const [items, total] = await Promise.all([
    Scholarship.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('name description eligibility minimumRequirements maxApplicants amount targetAmount raisedAmount deadline requiredDocuments sponsor category status applicantsCount studentsSupported')
      .populate(SPONSOR_POPULATE)
      .lean(),
    Scholarship.countDocuments(query),
  ]);

  return { items, meta: paginationMeta(total, page, limit) };
}

/** Single scholarship + my application state. */
export async function getScholarshipById({ scholarshipId, userId }) {
  const scholarship = await Scholarship.findById(scholarshipId)
    .select('name description eligibility minimumRequirements maxApplicants amount targetAmount raisedAmount deadline requiredDocuments sponsor category status applicantsCount studentsSupported createdAt')
    .populate(SPONSOR_POPULATE)
    .lean();
  if (!scholarship) throw notFound('Scholarship not found', 'SCHOLARSHIP_NOT_FOUND');

  const myApplication = userId
    ? await ScholarshipApplication.findOne({ scholarship: scholarshipId, student: userId })
        .select('status createdAt')
        .lean()
    : null;

  const fundedPercent = scholarship.targetAmount ? Math.round((scholarship.raisedAmount / scholarship.targetAmount) * 100) : 0;

  return { scholarship: { ...scholarship, fundedPercent, myApplication: myApplication ?? null } };
}

/** Create campaign (alumni/faculty/admin — spec §2, §11). */
export async function createScholarship({ data, userId, role, req }) {
  if (!REVIEWER_ROLES.includes(role)) {
    throw forbidden('Only alumni, faculty, and administrators can create scholarships', 'SCHOLARSHIP_CREATE_FORBIDDEN');
  }
  const scholarship = await Scholarship.create({ ...data, sponsor: userId });
  await logAudit({
    action: 'scholarship_approval',
    actorId: userId,
    targetType: 'scholarship',
    targetId: scholarship._id,
    details: { action: 'create', name: scholarship.name },
    req,
  });
  return scholarship;
}

/** Update (sponsor or admin). */
export async function updateScholarship({ scholarshipId, data, userId, role, req }) {
  const scholarship = await Scholarship.findById(scholarshipId);
  if (!scholarship) throw notFound('Scholarship not found', 'SCHOLARSHIP_NOT_FOUND');
  if (role !== 'admin' && String(scholarship.sponsor) !== String(userId)) {
    throw forbidden('Only the sponsor or an admin can edit this scholarship', 'SCHOLARSHIP_UPDATE_FORBIDDEN');
  }
  Object.assign(scholarship, data);
  await scholarship.save();
  await logAudit({
    action: 'scholarship_approval',
    actorId: userId,
    targetType: 'scholarship',
    targetId: scholarship._id,
    details: { action: 'update', name: scholarship.name },
    req,
  });
  return scholarship;
}

/** Student applies (spec §11): income, academics, reason, documents. */
export async function applyToScholarship({ data, userId, req }) {
  const scholarship = await Scholarship.findById(data.scholarshipId);
  if (!scholarship) throw notFound('Scholarship not found', 'SCHOLARSHIP_NOT_FOUND');
  if (scholarship.status !== 'active') throw badRequest('This scholarship is not accepting applications', 'SCHOLARSHIP_CLOSED');
  if (scholarship.deadline < new Date()) throw badRequest('The application deadline has passed', 'APPLICATION_CLOSED');
  if (scholarship.applicantsCount >= scholarship.maxApplicants) {
    throw conflict('This scholarship has reached its maximum number of applicants', 'MAX_APPLICANTS');
  }

  const existing = await ScholarshipApplication.findOne({ scholarship: scholarship._id, student: userId });
  if (existing) throw conflict('You have already applied for this scholarship', 'ALREADY_APPLIED');

  const student = await User.findById(userId).select('name email role');
  if (!student || student.role !== 'student') {
    throw forbidden('Only students can apply for scholarships', 'STUDENT_ONLY');
  }

  const application = await ScholarshipApplication.create({
    scholarship: scholarship._id,
    student: userId,
    rollNumber: data.rollNumber,
    department: data.department,
    familyIncome: data.familyIncome,
    academicPerformance: data.academicPerformance,
    reason: data.reason,
    documents: data.documents,
    status: 'applied',
  });

  await Scholarship.updateOne({ _id: scholarship._id }, { $inc: { applicantsCount: 1 } });

  await createNotification({
    recipientId: scholarship.sponsor,
    type: 'scholarship_status',
    title: 'New scholarship application',
    body: `${student?.name ?? 'A student'} applied for "${scholarship.name}"`,
    data: { url: '/scholarships/review', scholarshipId: scholarship._id },
  });

  await logAudit({
    action: 'scholarship_approval',
    actorId: userId,
    targetType: 'scholarship',
    targetId: scholarship._id,
    details: { action: 'apply', name: scholarship.name },
    req,
  });

  return application;
}

/** Student's own applications (spec §13). */
export async function listMyApplications({ userId }) {
  const items = await ScholarshipApplication.find({ student: userId })
    .sort({ createdAt: -1 })
    .populate({ path: 'scholarship', select: 'name amount targetAmount deadline sponsor category status' })
    .lean();
  return items;
}

/** Reviewer list of applications (spec §13). */
export async function listApplicationsForReview({ userId, role, status, page, limit }) {
  if (!REVIEWER_ROLES.includes(role)) {
    throw forbidden('You are not authorized to review applications', 'REVIEW_FORBIDDEN');
  }

  const query = {};
  if (status && status !== 'all') query.status = status;

  // Non-admin reviewers only see applications for scholarships they sponsor.
  if (role !== 'admin') {
    const sponsored = await Scholarship.find({ sponsor: userId }).select('_id').lean();
    query.scholarship = { $in: sponsored.map((s) => s._id) };
  }

  const [items, total] = await Promise.all([
    ScholarshipApplication.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({ path: 'scholarship', select: 'name amount sponsor' })
      .populate({ path: 'student', select: 'name email avatar role' })
      .lean(),
    ScholarshipApplication.countDocuments(query),
  ]);

  return { items, meta: paginationMeta(total, page, limit) };
}

/** Single application detail (student owner or reviewer). */
export async function getApplicationById({ applicationId, userId, role }) {
  const application = await ScholarshipApplication.findById(applicationId)
    .populate({ path: 'scholarship', select: 'name amount targetAmount deadline sponsor category status raisedAmount' })
    .populate({ path: 'student', select: 'name email avatar role' })
    .lean();
  if (!application) throw notFound('Application not found', 'APPLICATION_NOT_FOUND');

  const isOwner = String(application.student._id) === String(userId);
  const isSponsor = String(application.scholarship.sponsor) === String(userId);
  if (!isOwner && !isSponsor && role !== 'admin') {
    throw forbidden('You cannot view this application', 'APPLICATION_FORBIDDEN');
  }

  return application;
}

/**
 * Reviewer workflow (spec §11, §13):
 * applied → under_review → shortlisted → approved → rejected → funded → completed
 * State machine with transition validation + notifications to the student.
 */
const TRANSITIONS = {
  applied: ['under_review', 'rejected'],
  under_review: ['shortlisted', 'rejected'],
  shortlisted: ['approved', 'rejected'],
  approved: ['funded', 'rejected'],
  funded: ['completed'],
  rejected: [],
  completed: [],
};

export async function reviewApplication({ applicationId, userId, role, data, req }) {
  if (!REVIEWER_ROLES.includes(role)) throw forbidden('You are not authorized to review applications', 'REVIEW_FORBIDDEN');

  const application = await ScholarshipApplication.findById(applicationId).populate('scholarship');
  if (!application) throw notFound('Application not found', 'APPLICATION_NOT_FOUND');
  if (role !== 'admin' && String(application.scholarship.sponsor) !== String(userId)) {
    throw forbidden('Only the sponsor or an admin can review this application', 'REVIEW_FORBIDDEN');
  }

  const allowed = TRANSITIONS[application.status] ?? [];
  if (!allowed.includes(data.status)) {
    throw badRequest(
      `Cannot move from "${application.status}" to "${data.status}"`,
      'INVALID_TRANSITION',
    );
  }

  application.status = data.status;
  application.reviewedBy = userId;
  application.reviewedAt = new Date();
  if (data.status === 'approved' && data.approvedAmount) {
    application.approvedAmount = data.approvedAmount;
  }
  if (data.comment) {
    application.reviewComments.push({ by: userId, text: data.comment });
  }
  await application.save();

  // Funded → update campaign stats.
  if (data.status === 'funded') {
    await Scholarship.updateOne(
      { _id: application.scholarship._id },
      { $inc: { studentsSupported: 1 } },
    );
  }

  await createNotification({
    recipientId: application.student,
    type: 'scholarship_status',
    title: `Scholarship application ${data.status.replace('_', ' ')}`,
    body: `Your application for "${application.scholarship.name}" is now ${data.status.replace('_', ' ')}${data.comment ? ` — ${data.comment}` : ''}`,
    data: { url: '/scholarships/applications', applicationId: application._id },
  });

  await logAudit({
    action: 'scholarship_approval',
    actorId: userId,
    targetType: 'scholarship',
    targetId: application.scholarship._id,
    details: { applicationId, action: 'review', from: application.status, to: data.status },
    req,
  });

  return application;
}

/** Add a comment without changing status (spec §13 review comments). */
export async function addReviewComment({ applicationId, userId, role, text }) {
  if (!REVIEWER_ROLES.includes(role)) throw forbidden('You are not authorized to comment', 'REVIEW_FORBIDDEN');
  const application = await ScholarshipApplication.findById(applicationId).populate('scholarship');
  if (!application) throw notFound('Application not found', 'APPLICATION_NOT_FOUND');
  if (role !== 'admin' && String(application.scholarship.sponsor) !== String(userId)) {
    throw forbidden('Only the sponsor or an admin can comment', 'REVIEW_FORBIDDEN');
  }
  application.reviewComments.push({ by: userId, text });
  await application.save();
  return application;
}
