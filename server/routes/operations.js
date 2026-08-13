import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';
import { listAuditActions, listAuditLogs } from '../services/auditLogService.js';
import { getSettings, updateSettings } from '../services/settingsService.js';
import { listReportTypes, serializeReport } from '../services/reportExportService.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parsePagination } from '../utils/pagination.js';
import { badRequest } from '../utils/ApiError.js';

const router = Router();
router.use(requireAuth, requireAdmin);

// --- Reports (spec §40) ---
router.get('/reports/types', asyncHandler(async (_req, res) => {
  sendSuccess(res, { message: 'Report types', data: { items: listReportTypes() } });
}));

router.get('/reports/:type', asyncHandler(async (req, res) => {
  const format = ['csv', 'xlsx', 'pdf'].includes(req.query.format) ? req.query.format : 'csv';
  try {
    const { buffer, filename, mime } = await serializeReport({ type: req.params.type, format });
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    if (error.message === 'REPORT_TYPE_NOT_FOUND') throw badRequest('Unknown report type', 'REPORT_TYPE_NOT_FOUND');
    throw error;
  }
}));

// --- Audit logs (spec §39) ---
router.get('/audit-logs', asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const { action, actorId, from, to, search } = req.query;
  const result = await listAuditLogs({ filters: { action, actorId, from, to, search }, page, limit });
  sendSuccess(res, { message: 'Audit logs', data: result });
}));

router.get('/audit-logs/actions', asyncHandler(async (_req, res) => {
  const items = await listAuditActions();
  sendSuccess(res, { message: 'Audit actions', data: { items } });
}));

// --- Settings (spec §20) ---
router.get('/settings', asyncHandler(async (_req, res) => {
  const data = await getSettings();
  sendSuccess(res, { message: 'System settings', data });
}));

router.put(
  '/settings',
  validate(z.record(z.string().min(1).max(100), z.any()).refine((value) => Object.keys(value).length > 0, { message: 'Provide at least one setting' })),
  asyncHandler(async (req, res) => {
    const data = await updateSettings({ updates: req.body, actorId: req.user._id, req });
    sendSuccess(res, { message: 'Settings updated', data });
  }),
);

export default router;
