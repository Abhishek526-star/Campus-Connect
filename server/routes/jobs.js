import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { applyJobSchema, createJobSchema, moderateSchema, reportJobSchema, updateJobSchema } from '../validators/job.js';
import {
  apply, create, getJob, getJobs, moderate, remove, report, save, saved, unsave, update,
} from '../controllers/jobController.js';

const router = Router();

router.get('/', requireAuth, getJobs);
router.get('/saved', requireAuth, saved);
router.get('/:id', requireAuth, getJob);
router.post('/', requireAuth, validate(createJobSchema), create);
router.post('/save', requireAuth, validate(applyJobSchema), save);
router.delete('/save', requireAuth, validate(applyJobSchema), unsave);
router.post('/apply', requireAuth, validate(applyJobSchema), apply);
router.post('/report', requireAuth, validate(reportJobSchema), report);
router.put('/:id', requireAuth, validate(updateJobSchema), update);
router.delete('/:id', requireAuth, remove);
router.put('/:id/moderate', requireAuth, requireAdmin, validate(moderateSchema), moderate);

export default router;
