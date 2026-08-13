import { z } from 'zod';
import { MEETING_TYPES } from '../config/constants.js';

const timeString = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Enter a valid time (HH:mm, 24-hour)');

const urlField = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || /^https?:\/\//.test(v), 'Enter a valid URL (https://…)')
  .optional()
  .or(z.literal(''));

const participantIds = z
  .array(z.string().min(5, 'Invalid participant id'))
  .min(1, 'Select at least one participant')
  .max(20, 'At most 20 participants');

/** Create meeting (spec §8). */
export const createMeetingSchema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(150),
    date: z.coerce.date('Enter a valid date'),
    startTime: timeString,
    endTime: timeString.optional().or(z.literal('')),
    type: z.enum(MEETING_TYPES).default('one_on_one'),
    description: z.string().trim().max(2000).optional().or(z.literal('')),
    location: z.string().trim().max(200).optional().or(z.literal('')),
    meetingLink: urlField,
    participantIds,
  })
  .refine((data) => {
    // End time must be after start time when both provided.
    if (!data.endTime) return true;
    return data.endTime > data.startTime;
  }, {
    message: 'End time must be after the start time',
    path: ['endTime'],
  });

/** Update/reschedule (organizer) — all optional. */
export const updateMeetingSchema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(150).optional(),
    date: z.coerce.date('Enter a valid date').optional(),
    startTime: timeString.optional(),
    endTime: timeString.optional().or(z.literal('')),
    type: z.enum(MEETING_TYPES).optional(),
    description: z.string().trim().max(2000).optional().or(z.literal('')),
    location: z.string().trim().max(200).optional().or(z.literal('')),
    meetingLink: urlField,
  })
  .refine((data) => {
    if (!data.startTime || !data.endTime) return true;
    return data.endTime > data.startTime;
  }, {
    message: 'End time must be after the start time',
    path: ['endTime'],
  });

/** Invitee response (accept/reject). */
export const respondSchema = z.object({
  status: z.enum(['accepted', 'rejected'], 'Select accepted or rejected'),
});

/** Status change (organizer). */
export const organizerStatusSchema = z.object({
  status: z.enum(['scheduled', 'completed', 'cancelled'], 'Invalid status'),
});
