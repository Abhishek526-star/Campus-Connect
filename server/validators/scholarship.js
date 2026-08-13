import { z } from 'zod';
import { SCHOLARSHIP_CATEGORIES, SCHOLARSHIP_STATUSES } from '../config/constants.js';

const attachment = z
  .object({
    url: z.string().refine((v) => v.startsWith('http') || v.startsWith('/uploads/'), 'Document url is invalid'),
    publicId: z.string().optional().nullable(),
    name: z.string().max(255).optional(),
    mimeType: z.string().max(120).optional(),
    size: z.number().max(25 * 1024 * 1024).optional(),
  })
  .optional()
  .nullable();

/** Create a scholarship campaign (alumni/faculty/admin — spec §11). */
export const createScholarshipSchema = z
  .object({
    name: z.string().trim().min(3, 'Name must be at least 3 characters').max(150),
    description: z.string().trim().min(10, 'Description must be at least 10 characters').max(5000),
    eligibility: z.string().trim().min(10, 'Eligibility must be at least 10 characters').max(2000),
    minimumRequirements: z.array(z.string().trim().min(1).max(300)).max(20).optional().default([]),
    maxApplicants: z.coerce.number().int().min(1).max(10000).default(50),
    amount: z.coerce.number().min(1, 'Amount must be positive'),
    targetAmount: z.coerce.number().min(1, 'Target must be positive'),
    deadline: z.coerce.date('Enter a valid deadline'),
    requiredDocuments: z.array(z.string().trim().min(1).max(300)).max(20).optional().default([]),
    category: z.enum(SCHOLARSHIP_CATEGORIES).default('need_based'),
    status: z.enum(SCHOLARSHIP_STATUSES).optional(),
  })
  .refine((data) => data.deadline > new Date(), {
    message: 'Deadline must be in the future',
    path: ['deadline'],
  });

/** Update — all optional (zod 4: no .partial() on refined schemas). */
export const updateScholarshipSchema = z
  .object({
    name: z.string().trim().min(3, 'Name must be at least 3 characters').max(150).optional(),
    description: z.string().trim().min(10).max(5000).optional(),
    eligibility: z.string().trim().min(10).max(2000).optional(),
    minimumRequirements: z.array(z.string().trim().min(1).max(300)).max(20).optional(),
    maxApplicants: z.coerce.number().int().min(1).max(10000).optional(),
    amount: z.coerce.number().min(1).optional(),
    targetAmount: z.coerce.number().min(1).optional(),
    deadline: z.coerce.date('Enter a valid deadline').optional(),
    requiredDocuments: z.array(z.string().trim().min(1).max(300)).max(20).optional(),
    category: z.enum(SCHOLARSHIP_CATEGORIES).optional(),
    status: z.enum(SCHOLARSHIP_STATUSES).optional(),
  })
  .refine((data) => !data.deadline || data.deadline > new Date(), {
    message: 'Deadline must be in the future',
    path: ['deadline'],
  });

/** Student application (spec §11). The scholarship id comes from the URL
 *  param; the controller injects it into the validated body. */
export const applyScholarshipSchema = z.object({
  scholarshipId: z.string().min(5).optional(),
  rollNumber: z.string().trim().min(2, 'Roll number is required').max(20),
  department: z.string().trim().min(2, 'Department is required').max(80),
  familyIncome: z.coerce.number().min(0, 'Family income must be positive'),
  academicPerformance: z.coerce.number().min(0, 'Minimum 0').max(100, 'Maximum 100'),
  reason: z.string().trim().min(10, 'Please explain your reason (at least 10 characters)').max(2000),
  documents: z
    .array(attachment)
    .min(1, 'Upload at least one supporting document')
    .max(10, 'At most 10 documents'),
});

/** Reviewer workflow: status + optional comment. */
export const reviewApplicationSchema = z.object({
  status: z.enum(
    ['under_review', 'shortlisted', 'approved', 'rejected', 'funded', 'completed'],
    'Select a valid status',
  ),
  comment: z.string().trim().max(1000).optional().or(z.literal('')),
  approvedAmount: z.coerce.number().min(1, 'Approved amount must be positive').optional(),
});

/** Add a review comment. */
export const addCommentSchema = z.object({
  text: z.string().trim().min(2, 'Comment is too short').max(1000),
});
