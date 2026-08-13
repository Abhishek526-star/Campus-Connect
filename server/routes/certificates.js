import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import {
  generateCertificates,
  listMyCertificates,
  verifyCertificate,
} from '../services/certificateService.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Issue certificates for a completed event (organizer/admin).
router.post(
  '/event/:eventId/issue',
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await generateCertificates({ eventId: req.params.eventId, userId: req.user._id, role: req.user.role, req });
    sendSuccess(res, { status: 201, message: `Certificates issued to ${result.issued.length} attendee(s)`, data: result });
  }),
);

// My certificates.
router.get('/mine', requireAuth, asyncHandler(async (req, res) => {
  const items = await listMyCertificates({ userId: req.user._id });
  sendSuccess(res, { message: 'My certificates', data: { items } });
}));

// Public QR verification (no auth — anyone with the QR can verify).
router.get(
  '/verify',
  validate(z.object({ certificateId: z.string().min(5, 'Invalid certificate id').max(100) }), 'query'),
  asyncHandler(async (req, res) => {
    const result = await verifyCertificate({ certificateId: req.query.certificateId });
    sendSuccess(res, { message: 'Certificate verified', data: result });
  }),
);

export default router;
