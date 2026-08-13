import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getMyAnalytics } from '../services/analyticsService.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const data = await getMyAnalytics({ userId: req.user._id, role: req.user.role });
  sendSuccess(res, { message: 'My analytics', data });
}));

export default router;
