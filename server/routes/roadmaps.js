import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';
import { getRoadmapByRole, listRoadmaps, upsertRoadmap } from '../services/roadmapService.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(async (_req, res) => {
  const items = await listRoadmaps();
  sendSuccess(res, { message: 'Career roadmaps', data: { items } });
}));

router.get('/:role', requireAuth, asyncHandler(async (req, res) => {
  const roadmap = await getRoadmapByRole({ role: req.params.role });
  sendSuccess(res, { message: 'Roadmap', data: { roadmap } });
}));

router.put(
  '/:role',
  requireAuth,
  requireAdmin,
  validate(
    z.object({
      title: z.string().trim().min(3).max(200),
      description: z.string().trim().max(3000).optional().or(z.literal('')),
      steps: z
        .array(
          z.object({
            title: z.string().trim().min(1).max(200),
            description: z.string().trim().max(2000).optional().or(z.literal('')),
            duration: z.string().trim().max(80).optional().or(z.literal('')),
            resources: z.array(z.string().trim().max(500)).max(20).optional(),
          }),
        )
        .max(20)
        .optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const roadmap = await upsertRoadmap({ role: req.params.role, data: req.body, userId: req.user._id });
    sendSuccess(res, { status: 201, message: 'Roadmap saved', data: { roadmap } });
  }),
);

export default router;
