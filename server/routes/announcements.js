import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';
import { ANNOUNCEMENT_AUDIENCES, ANNOUNCEMENT_CATEGORIES } from '../config/constants.js';
import {
  create, getAnnouncements, pin, remove, update,
} from '../controllers/announcementController.js';

const router = Router();

const bodySchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200),
  body: z.string().trim().min(5, 'Content must be at least 5 characters').max(5000),
  category: z.enum(ANNOUNCEMENT_CATEGORIES).optional(),
  audience: z.enum(ANNOUNCEMENT_AUDIENCES).default('all'),
  pinned: z.boolean().optional(),
  expiresAt: z.coerce.date().optional().nullable(),
});

const updateSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  body: z.string().trim().min(5).max(5000).optional(),
  category: z.enum(ANNOUNCEMENT_CATEGORIES).optional(),
  audience: z.enum(ANNOUNCEMENT_AUDIENCES).optional(),
  pinned: z.boolean().optional(),
  expiresAt: z.coerce.date().optional().nullable(),
});

router.get('/', requireAuth, getAnnouncements);
router.post('/', requireAuth, validate(bodySchema), create);
router.put('/:id', requireAuth, validate(updateSchema), update);
router.delete('/:id', requireAuth, remove);
router.patch('/:id/pin', requireAuth, pin);

export default router;
