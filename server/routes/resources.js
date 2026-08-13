import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';
import {
  createResourceSchema,
  moderateResourceSchema,
  rateResourceSchema,
  reportResourceSchema,
  updateResourceSchema,
} from '../validators/resource.js';
import {
  bookmark, bookmarked, categories, create, download, getResource, getResources, moderate, rate, remove, report, unbookmark, update,
} from '../controllers/resourceController.js';

const router = Router();

router.get('/', requireAuth, getResources);
router.get('/bookmarks', requireAuth, bookmarked);
router.get('/categories', requireAuth, categories);
router.get('/:id', requireAuth, getResource);
router.post('/', requireAuth, validate(createResourceSchema), create);
router.post('/bookmark', requireAuth, validate(z.object({ resourceId: z.string().min(5) })), bookmark);
router.delete('/bookmark', requireAuth, validate(z.object({ resourceId: z.string().min(5) })), unbookmark);
router.post('/:id/rate', requireAuth, validate(rateResourceSchema), rate);
router.post('/:id/download', requireAuth, download);
router.post('/:id/report', requireAuth, validate(reportResourceSchema), report);
router.put('/:id', requireAuth, validate(updateResourceSchema), update);
router.delete('/:id', requireAuth, remove);
router.put('/:id/moderate', requireAuth, requireAdmin, validate(moderateResourceSchema), moderate);

export default router;
