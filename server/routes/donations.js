import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';
import {
  createOrder,
  getAll,
  getMine,
  receipt,
  stats,
  verify,
  webhook,
} from '../controllers/donationController.js';

const router = Router();

// Public webhook — receives the RAW body (app.js routes it past express.json()).
// req.body is the raw Buffer; req.rawBody aliases it for the handler.
router.post('/webhook', (req, _res, next) => {
  req.rawBody = req.body;
  next();
}, webhook);

// Authenticated donation flow.
router.post(
  '/create-order',
  requireAuth,
  validate(
    z.object({
      scholarshipId: z.string().min(5).optional().nullable(),
      amount: z.coerce.number().min(1, 'Amount must be positive').max(1000000),
      message: z.string().trim().max(500).optional().or(z.literal('')),
      anonymous: z.boolean().optional(),
    }),
  ),
  createOrder,
);
router.post(
  '/verify',
  requireAuth,
  validate(
    z.object({
      orderId: z.string().min(3, 'Order id is required'),
      paymentId: z.string().min(3, 'Payment id is required'),
      signature: z.string().min(10, 'Signature is required'),
    }),
  ),
  verify,
);
router.get('/mine', requireAuth, getMine);
router.get('/admin', requireAuth, requireAdmin, getAll);
router.get('/stats', requireAuth, stats);
router.get('/:id/receipt', requireAuth, receipt);

export default router;
