import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';
import { ROLES } from '../config/constants.js';
import { deleteUser, getAnalytics, getModerationQueue, getStats, listUsers, updateUser } from '../services/adminService.js';
import { listReports, resolveReport } from '../services/reportService.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parsePagination } from '../utils/pagination.js';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/stats', asyncHandler(async (_req, res) => {
  const data = await getStats();
  sendSuccess(res, { message: 'Admin statistics', data });
}));

router.get('/analytics', asyncHandler(async (_req, res) => {
  const data = await getAnalytics();
  sendSuccess(res, { message: 'Admin analytics', data });
}));

router.get('/users', asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const { search, role, status } = req.query;
  const result = await listUsers({ filters: { search, role, status }, page, limit });
  sendSuccess(res, { message: 'Users', data: result });
}));

router.put(
  '/users/:id',
  validate(
    z.object({
      role: z.enum(ROLES).optional(),
      isVerified: z.boolean().optional(),
      isApproved: z.boolean().optional(),
      isActive: z.boolean().optional(),
      badges: z.array(z.string()).optional(),
      name: z.string().trim().min(2).max(80).optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const user = await updateUser({ userId: req.params.id, actorId: req.user._id, data: req.body, req });
    sendSuccess(res, { message: 'User updated', data: { user } });
  }),
);

router.delete('/users/:id', asyncHandler(async (req, res) => {
  await deleteUser({ userId: req.params.id, actorId: req.user._id, req });
  sendSuccess(res, { message: 'User deleted (soft)' });
}));

router.get('/moderation', asyncHandler(async (_req, res) => {
  const data = await getModerationQueue();
  sendSuccess(res, { message: 'Moderation queue', data });
}));

// Reports (spec §20 content moderation)
router.get('/reports', asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const { status, targetType, search } = req.query;
  const result = await listReports({ filters: { status, targetType, search }, page, limit });
  sendSuccess(res, { message: 'Reports', data: result });
}));

router.put(
  '/reports/:id',
  validate(
    z.object({
      status: z.enum(['reviewed', 'resolved', 'dismissed']),
      removeContent: z.boolean().optional().default(false),
    }),
  ),
  asyncHandler(async (req, res) => {
    const result = await resolveReport({
      reportId: req.params.id,
      status: req.body.status,
      actorId: req.user._id,
      removeContent: req.body.removeContent,
      req,
    });
    sendSuccess(res, { message: 'Report updated', data: result });
  }),
);

export default router;
