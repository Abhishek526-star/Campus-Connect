import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  deleteAll,
  deleteOne,
  getNotifications,
  getUnreadCount,
  markAll,
  markOneRead,
} from '../controllers/notificationController.js';

const router = Router();

router.use(requireAuth);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAll);
router.patch('/:id/read', markOneRead);
router.delete('/:id', deleteOne);
router.delete('/', deleteAll);

export default router;
