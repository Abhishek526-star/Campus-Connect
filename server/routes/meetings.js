import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createMeetingSchema, organizerStatusSchema, respondSchema, updateMeetingSchema } from '../validators/meeting.js';
import {
  create,
  getMeeting,
  getMeetings,
  remind,
  remove,
  respond,
  setStatus,
  update,
} from '../controllers/meetingController.js';

const router = Router();

router.get('/', requireAuth, getMeetings);
router.get('/:id', requireAuth, getMeeting);
router.post('/', requireAuth, validate(createMeetingSchema), create);
router.put('/:id', requireAuth, validate(updateMeetingSchema), update);
router.patch('/:id/respond', requireAuth, validate(respondSchema), respond);
router.patch('/:id/status', requireAuth, validate(organizerStatusSchema), setStatus);
router.post('/:id/remind', requireAuth, remind);
router.delete('/:id', requireAuth, remove);

export default router;
