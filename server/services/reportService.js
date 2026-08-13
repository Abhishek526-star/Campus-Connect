import Report from '../models/report.js';
import User from '../models/user.js';
import { notFound, badRequest } from '../utils/ApiError.js';
import { logAudit } from '../utils/audit.js';
import { createNotification } from './notificationService.js';
import { deletePost } from './postService.js';
import { deleteJob } from './jobService.js';
import { deleteResource } from './resourceService.js';
import { deleteUser } from './adminService.js';

/** Resolve a moderation action into the delete function for that target type. */
const REMOVERS = {
  post: (id, actor, req) => deletePost({ postId: id, userId: actor, role: 'admin', req }),
  job: (id, actor, req) => deleteJob({ jobId: id, userId: actor, role: 'admin', req }),
  resource: (id, actor, req) => deleteResource({ resourceId: id, userId: actor, role: 'admin', req }),
  user: (id, actor, req) => deleteUser({ userId: id, actorId: actor, req }),
};

/**
 * List moderation reports with optional filters (spec §39).
 */
export async function listReports({ filters = {}, page = 1, limit = 20 }) {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.targetType) query.targetType = filters.targetType;
  if (filters.search) {
    const users = await User.find({ name: { $regex: filters.search, $options: 'i' } }).select('_id').lean();
    query.reporter = { $in: users.map((u) => u._id) };
  }

  const [items, total] = await Promise.all([
    Report.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({ path: 'reporter', select: 'name email role' })
      .populate({ path: 'reviewedBy', select: 'name email' })
      .lean(),
    Report.countDocuments(query),
  ]);

  const counts = await Report.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const statusCounts = Object.fromEntries(counts.map((c) => [c._id, c.count]));

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    counts: statusCounts,
  };
}

/**
 * Resolve a report: mark reviewed/resolved/dismissed and optionally remove the
 * reported content (spec §39 moderation).
 */
export async function resolveReport({ reportId, status, actorId, removeContent = false, req }) {
  const report = await Report.findById(reportId);
  if (!report) throw notFound('Report not found', 'REPORT_NOT_FOUND');

  report.status = status;
  report.reviewedBy = actorId;
  report.resolvedAt = new Date();
  await report.save();

  if (removeContent) {
    const remover = REMOVERS[report.targetType];
    if (!remover) {
      throw badRequest(`Content removal is not supported for ${report.targetType} reports`, 'REMOVAL_UNSUPPORTED');
    }
    await remover(report.targetId, actorId, req);
  }

  const reporter = await User.findById(report.reporter).select('name');
  if (reporter) {
    await createNotification({
      recipientId: report.reporter,
      type: 'report_resolved',
      title: 'Your report has been reviewed',
      body:
        status === 'resolved'
          ? 'The content you reported was reviewed and removed.'
          : 'The content you reported was reviewed — no action was taken.',
      data: { reportId: report._id.toString(), targetType: report.targetType },
    });
  }

  await logAudit({
    action: 'admin_action',
    actorId,
    targetType: 'report',
    targetId: report._id,
    details: { status, removeContent, targetType: report.targetType, targetId: report.targetId },
    req,
  });

  return report;
}
