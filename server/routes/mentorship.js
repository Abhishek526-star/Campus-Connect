import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';
import { MENTORSHIP_AREAS, MENTORSHIP_STATUSES } from '../config/constants.js';
import {
  addSessionHandler,
  createOfferHandler,
  grantReferralHandler,
  listOpenOffersHandler,
  listSessionsHandler,
  mentorsHandler,
  myMentorshipsHandler,
  myReferralsHandler,
  requestHandler,
  requestReferralHandler,
  updateStatusHandler,
} from '../controllers/mentorshipController.js';

const router = Router();

// Mentorship
router.get('/mentors', requireAuth, mentorsHandler);
router.post(
  '/mentorships',
  requireAuth,
  validate(
    z.object({
      mentorId: z.string().min(5),
      area: z.enum(MENTORSHIP_AREAS),
      message: z.string().trim().max(1500).optional().or(z.literal('')),
      goals: z.array(z.string().trim().min(1).max(200)).max(10).optional(),
    }),
  ),
  requestHandler,
);
router.get('/mentorships', requireAuth, myMentorshipsHandler);
router.patch(
  '/mentorships/:id/status',
  requireAuth,
  validate(z.object({ status: z.enum(MENTORSHIP_STATUSES) })),
  updateStatusHandler,
);
router.post(
  '/mentorships/:id/sessions',
  requireAuth,
  validate(z.object({ scheduledAt: z.coerce.date(), notes: z.string().trim().max(2000).optional().or(z.literal('')) })),
  addSessionHandler,
);
router.get('/mentorships/:id/sessions', requireAuth, listSessionsHandler);

// Referrals
router.get('/referrals/offers', requireAuth, listOpenOffersHandler);
router.post(
  '/referrals',
  requireAuth,
  validate(z.object({ jobId: z.string().min(5), note: z.string().trim().max(1000).optional().or(z.literal('')) })),
  createOfferHandler,
);
router.get('/referrals', requireAuth, myReferralsHandler);
router.post('/referrals/:id/request', requireAuth, requestReferralHandler);
router.patch('/referrals/:id/grant', requireAuth, grantReferralHandler);

export default router;
