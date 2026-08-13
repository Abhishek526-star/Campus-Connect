import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';
import {
  accept,
  cancel,
  getConnections,
  getDirectoryHandler,
  getOutgoingRequests,
  getRequests,
  getSuggestionsHandler,
  reject,
  remove,
  send,
} from '../controllers/connectionController.js';

const router = Router();

// Directory (spec §6)
router.get('/people', requireAuth, getDirectoryHandler);

// Connections (spec §6)
router.get('/connections', requireAuth, getConnections);
router.get('/connections/requests', requireAuth, getRequests);
router.get('/connections/requests/outgoing', requireAuth, getOutgoingRequests);
router.get('/connections/suggestions', requireAuth, getSuggestionsHandler);
router.post(
  '/connections/request',
  requireAuth,
  validate(z.object({ recipientId: z.string().min(5, 'Recipient id is required') })),
  send,
);
router.put('/connections/:id/accept', requireAuth, accept);
router.put('/connections/:id/reject', requireAuth, reject);
router.delete('/connections/:id', requireAuth, cancel);
router.delete('/connections/:id/remove', requireAuth, remove);

export default router;
