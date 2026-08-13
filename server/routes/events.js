import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createEventSchema, updateEventSchema } from '../validators/event.js';
import {
  cancel,
  create,
  getEvent,
  getEvents,
  getMyEvents,
  participants,
  register,
  remove,
  update,
} from '../controllers/eventController.js';

const router = Router();

router.get('/', requireAuth, getEvents);
router.get('/mine', requireAuth, getMyEvents);
router.get('/:id', requireAuth, getEvent);
router.get('/:id/participants', requireAuth, participants);
router.post('/', requireAuth, validate(createEventSchema), create);
router.post('/:id/register', requireAuth, register);
router.delete('/:id/register', requireAuth, cancel);
router.put('/:id', requireAuth, validate(updateEventSchema), update);
router.delete('/:id', requireAuth, remove);

export default router;
