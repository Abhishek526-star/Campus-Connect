import { z } from 'zod';
import { ATTENDANCE_STATUSES } from '../config/constants.js';

/** QR check-in token from the scanned QR code. */
export const checkInSchema = z.object({
  qrToken: z.string().min(10, 'Invalid QR code').max(1024),
});

/** Manual attendance marking (organizer). */
export const manualMarkSchema = z
  .object({
    userId: z.string().min(5, 'User id is required'),
    status: z.enum(ATTENDANCE_STATUSES, 'Select a valid status'),
    note: z.string().trim().max(500).optional().or(z.literal('')),
  })
  .refine((data) => ['present', 'absent', 'late'].includes(data.status), {
    message: 'Manual marking requires present, absent, or late',
    path: ['status'],
  });

/** Edit an attendance record (organizer). */
export const editAttendanceSchema = z.object({
  status: z.enum(ATTENDANCE_STATUSES, 'Select a valid status'),
  note: z.string().trim().max(500).optional().or(z.literal('')),
});

/** QR token generation (organizer) — duration in minutes. */
export const qrTokenSchema = z.object({
  durationMinutes: z.coerce.number().int().min(1, 'Duration must be at least 1 minute').max(180, 'Duration must be at most 3 hours').default(15),
});
