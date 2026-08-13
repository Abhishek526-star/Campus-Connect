import AuditLog from '../models/auditLog.js';
import { paginationMeta } from '../utils/pagination.js';

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** List audit logs (admin, spec §39) with action/actor/date filters. */
export async function listAuditLogs({ filters = {}, page, limit }) {
  const query = {};
  if (filters.action && filters.action !== 'all') query.action = filters.action;
  if (filters.actorId) query.actor = filters.actorId;
  if (filters.from || filters.to) {
    query.createdAt = {};
    if (filters.from) query.createdAt.$gte = new Date(filters.from);
    if (filters.to) query.createdAt.$lte = new Date(filters.to);
  }
  if (filters.search) {
    query.$or = [
      { action: { $regex: escapeRegExp(filters.search), $options: 'i' } },
      { reason: { $regex: escapeRegExp(filters.search), $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({ path: 'actor', select: 'name email role avatar' })
      .lean(),
    AuditLog.countDocuments(query),
  ]);

  return { items, meta: paginationMeta(total, page, limit) };
}

/** Distinct audit actions for the filter dropdown. */
export async function listAuditActions() {
  const actions = await AuditLog.distinct('action');
  return actions.sort();
}
