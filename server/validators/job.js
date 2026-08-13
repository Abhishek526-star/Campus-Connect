import { z } from 'zod';
import { JOB_TYPES, WORK_MODES } from '../config/constants.js';

const urlField = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || /^https?:\/\//.test(v), 'Enter a valid URL (https://…)')
  .optional()
  .or(z.literal(''));

/** Create job/opportunity (spec §14). */
export const createJobSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(150),
  company: z.string().trim().min(2, 'Company is required').max(150),
  type: z.enum(JOB_TYPES).default('job'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(5000),
  location: z.string().trim().max(150).optional().or(z.literal('')),
  workMode: z.enum(WORK_MODES).default('onsite'),
  salary: z.string().trim().max(120).optional().or(z.literal('')),
  experience: z.string().trim().max(120).optional().or(z.literal('')),
  skills: z.array(z.string().trim().min(1).max(60)).max(30).optional().default([]),
  eligibility: z.string().trim().max(1000).optional().or(z.literal('')),
  deadline: z.coerce.date().optional().nullable(),
  applicationLink: urlField,
  applyThroughPlatform: z.boolean().optional().default(false),
  status: z.enum(['pending', 'approved', 'rejected', 'closed']).optional(),
});

/** Update — all optional. */
export const updateJobSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(150).optional(),
  company: z.string().trim().min(2).max(150).optional(),
  type: z.enum(JOB_TYPES).optional(),
  description: z.string().trim().min(10).max(5000).optional(),
  location: z.string().trim().max(150).optional().or(z.literal('')),
  workMode: z.enum(WORK_MODES).optional(),
  salary: z.string().trim().max(120).optional().or(z.literal('')),
  experience: z.string().trim().max(120).optional().or(z.literal('')),
  skills: z.array(z.string().trim().min(1).max(60)).max(30).optional(),
  eligibility: z.string().trim().max(1000).optional().or(z.literal('')),
  deadline: z.coerce.date().optional().nullable(),
  applicationLink: urlField,
  applyThroughPlatform: z.boolean().optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'closed']).optional(),
  isFeatured: z.boolean().optional(),
});

export const applyJobSchema = z.object({
  jobId: z.string().min(5, 'Opportunity id is required'),
});

export const moderateSchema = z.object({
  status: z.enum(['approved', 'rejected', 'closed'], 'Invalid moderation status'),
});

export const reportJobSchema = z.object({
  jobId: z.string().min(5, 'Opportunity id is required'),
  reason: z.string().trim().min(3, 'Please provide a reason').max(300),
  details: z.string().trim().max(1000).optional().or(z.literal('')),
});
