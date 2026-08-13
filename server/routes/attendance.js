import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { checkInSchema, editAttendanceSchema, manualMarkSchema, qrTokenSchema } from '../validators/attendance.js';
import {
  checkInHandler,
  checkOutHandler,
  edit,
  exportAttendance,
  generateQr,
  getEventAttendance,
  getMyAttendance,
  getSummary,
  manualMark,
} from '../controllers/attendanceController.js';

const router = Router();
router.use(requireAuth);

router.post('/check-in', validate(checkInSchema), checkInHandler);
router.post('/event/:eventId/qr-token', validate(qrTokenSchema), generateQr);
router.post('/event/:eventId/check-out', checkOutHandler);
router.get('/event/:eventId', getEventAttendance);
router.get('/event/:eventId/summary', getSummary);
router.post('/event/:eventId/manual', validate(manualMarkSchema), manualMark);
router.put('/:id', validate(editAttendanceSchema), edit);
router.get('/event/:eventId/export', exportAttendance);
router.get('/user/:userId', getMyAttendance);

export default router;
