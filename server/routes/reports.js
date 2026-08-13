import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateMemberReport } from '../services/memberReportService.js';

const router = Router();

/**
 * Individual member report (PDF) — full profile details + photo.
 * Accessible to admin, faculty and alumni (spec feature).
 */
router.get(
  '/member/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { buffer, filename } = await generateMemberReport({
      userId: req.params.id,
      viewerRole: req.user.role,
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }),
);

export default router;
