import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  addCommentSchema,
  applyScholarshipSchema,
  createScholarshipSchema,
  reviewApplicationSchema,
  updateScholarshipSchema,
} from '../validators/scholarship.js';
import {
  apply,
  comment,
  create,
  getApplication,
  getApplicationsForReview,
  getMyApplications,
  getScholarship,
  getScholarships,
  review,
  update,
} from '../controllers/scholarshipController.js';

const router = Router();
router.use(requireAuth);

// Applications — MUST be declared before /:id routes.
router.get('/applications/mine', getMyApplications);
router.get('/applications/review', getApplicationsForReview);
router.get('/applications/:id', getApplication);
router.put('/applications/:id/review', validate(reviewApplicationSchema), review);
router.post('/applications/:id/comment', validate(addCommentSchema), comment);

// Campaigns
router.get('/', getScholarships);
router.get('/:id', getScholarship);
router.post('/', validate(createScholarshipSchema), create);
router.put('/:id', validate(updateScholarshipSchema), update);

// Apply — after :id routes.
router.post('/:id/apply', validate(applyScholarshipSchema), apply);

export default router;
