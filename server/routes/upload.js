import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';
import { singleUpload } from '../middleware/upload.js';
import { uploadFileHandler } from '../controllers/uploadController.js';

const router = Router();

router.post('/', requireAuth, uploadLimiter, singleUpload('file'), uploadFileHandler);

export default router;
