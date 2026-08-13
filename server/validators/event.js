import { z } from 'zod';
import { DEPARTMENTS, EVENT_CATEGORIES, EVENT_MODES, EVENT_STATUSES } from '../config/constants.js';

const timeString = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Enter a valid time (HH:mm, 24-hour)')
  .optional()
  .or(z.literal(''));

const urlField = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || /^https?:\/\//.test(v), 'Enter a valid URL (https://…)')
  .optional()
  .or(z.literal(''));

const attachment = z
  .object({
    url: z.string().refine((v) => v.startsWith('http') || v.startsWith('/uploads/'), 'Image url is invalid'),
    publicId: z.string().optional().nullable(),
    name: z.string().max(255).optional(),
    mimeType: z.string().max(120).optional(),
    size: z.number().max(25 * 1024 * 1024).optional(),
  })
  .optional()
  .nullable();

/** Event create (spec §9). */
export const createEventSchema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(150),
    description: z.string().trim().min(10, 'Description must be at least 10 characters').max(5000),
    date: z.coerce.date('Enter a valid event date'),
    startTime: timeString,
    endTime: timeString,
    venue: z.string().trim().max(200).optional().or(z.literal('')),
    mode: z.enum(EVENT_MODES).default('offline'),
    meetingLink: urlField,
    maxParticipants: z.coerce.number().int().min(1, 'Maximum participants must be at least 1').max(10000).default(100),
    registrationDeadline: z.coerce.date().optional().nullable(),
    image: attachment,
    department: z.enum([...DEPARTMENTS, ''], 'Select a valid department').optional().or(z.literal('')),
    category: z.enum(EVENT_CATEGORIES, 'Select a valid category'),
    status: z.enum(EVENT_STATUSES).optional(),
  })
  .refine((data) => !data.registrationDeadline || data.registrationDeadline < data.date, {
    message: 'Registration deadline must be before the event date',
    path: ['registrationDeadline'],
  });

/** Event update — same shape, all optional (zod 4 forbids .partial() on refined schemas). */
export const updateEventSchema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(150).optional(),
    description: z.string().trim().min(10, 'Description must be at least 10 characters').max(5000).optional(),
    date: z.coerce.date('Enter a valid event date').optional(),
    startTime: timeString,
    endTime: timeString,
    venue: z.string().trim().max(200).optional().or(z.literal('')),
    mode: z.enum(EVENT_MODES).optional(),
    meetingLink: urlField,
    maxParticipants: z.coerce.number().int().min(1, 'Maximum participants must be at least 1').max(10000).optional(),
    registrationDeadline: z.coerce.date().optional().nullable(),
    image: attachment,
    department: z.enum([...DEPARTMENTS, ''], 'Select a valid department').optional().or(z.literal('')),
    category: z.enum(EVENT_CATEGORIES, 'Select a valid category').optional(),
    status: z.enum(EVENT_STATUSES).optional(),
  })
  .refine((data) => !data.registrationDeadline || !data.date || data.registrationDeadline < data.date, {
    message: 'Registration deadline must be before the event date',
    path: ['registrationDeadline'],
  });

/** Register for an event. */
export const registerEventSchema = z.object({
  eventId: z.string().min(5, 'Event id is required'),
});
