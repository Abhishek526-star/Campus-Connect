import AuditLog from '../models/auditLog.js';

/**
 * Persist an audit log entry (spec §39).
 *
 * @param {Object} params
 * @param {string} params.action  — one of AUDIT_ACTIONS
 * @param {string|null} [params.actorId] — acting user id (null for system)
 * @param {string} [params.targetType]
 * @param {string} [params.targetId]
 * @param {Object} [params.details]
 * @param {string} [params.reason]
 * @param {Object} [params.req] — express request (for IP + user agent)
 */
export async function logAudit({ action, actorId = null, targetType, targetId, details, reason, req }) {
  try {
    await AuditLog.create({
      actor: actorId,
      action,
      targetType,
      targetId,
      details,
      reason,
      ipAddress: req?.ip,
      userAgent: req?.get('user-agent')?.slice(0, 300),
    });
  } catch (error) {
    // Auditing must never break the primary operation.
    console.error('[audit] failed to write log:', error.message);
  }
}
