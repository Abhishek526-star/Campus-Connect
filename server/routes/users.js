import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { singleUpload } from '../middleware/upload.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';
import { privacySchema, updateBasicsSchema, updateRoleProfileSchema } from '../validators/user.js';
import {
  getById,
  getMe,
  patchAvatar,
  patchMe,
  patchPrivacy,
  patchRoleProfile,
} from '../controllers/userController.js';

const router = Router();

router.use(requireAuth);

router.get('/me', getMe);
router.patch('/me', validate(updateBasicsSchema), patchMe);
router.patch('/me/role-profile', validate(updateRoleProfileSchema), patchRoleProfile);
router.patch('/me/privacy', validate(privacySchema), patchPrivacy);
router.patch('/me/avatar', uploadLimiter, singleUpload('file'), patchAvatar);

// Order matters: /me must be matched before /:id.
router.get('/:id', getById);

export default router;
