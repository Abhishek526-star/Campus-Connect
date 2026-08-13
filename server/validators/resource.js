import { z } from 'zod';
import { RESOURCE_CATEGORIES, RESOURCE_FILE_TYPES } from '../config/constants.js';

const attachment = z
  .object({
    url: z.string().refine((v) => v.startsWith('http') || v.startsWith('/uploads/'), 'File url is invalid'),
    publicId: z.string().optional().nullable(),
    name: z.string().max(255).optional(),
    mimeType: z.string().max(120).optional(),
    size: z.number().max(25 * 1024 * 1024).optional(),
  })
  .optional()
  .nullable();

const urlField = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || /^https?:\/\//.test(v), 'Enter a valid URL (https://…)')
  .optional()
  .or(z.literal(''));

/** Create resource (spec §15) — file OR external link. */
export const createResourceSchema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200),
    description: z.string().trim().max(3000).optional().or(z.literal('')),
    category: z.enum(RESOURCE_CATEGORIES, 'Select a valid category'),
    subCategory: z.string().trim().max(120).optional().or(z.literal('')),
    subject: z.string().trim().max(120).optional().or(z.literal('')),
    semester: z.string().trim().max(20).optional().or(z.literal('')),
    fileType: z.enum(RESOURCE_FILE_TYPES, 'Select a valid file type'),
    file: attachment,
    externalUrl: urlField,
    tags: z.array(z.string().trim().min(1).max(60)).max(20).optional().default([]),
  })
  .refine((data) => data.fileType !== 'external' ? Boolean(data.file?.url) : Boolean(data.externalUrl), {
    message: data => (data.fileType === 'external' ? 'Provide the external URL' : 'Upload the resource file'),
    path: ['file'],
  });

/** Update — all optional. */
export const updateResourceSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  description: z.string().trim().max(3000).optional().or(z.literal('')),
  category: z.enum(RESOURCE_CATEGORIES).optional(),
  subCategory: z.string().trim().max(120).optional().or(z.literal('')),
  subject: z.string().trim().max(120).optional().or(z.literal('')),
  semester: z.string().trim().max(20).optional().or(z.literal('')),
  fileType: z.enum(RESOURCE_FILE_TYPES).optional(),
  file: attachment,
  externalUrl: urlField,
  tags: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
});

/** Rate a resource (1–5). */
export const rateResourceSchema = z.object({
  rating: z.coerce.number().int().min(1, 'Rating must be 1–5').max(5),
});

/** Admin moderation. */
export const moderateResourceSchema = z.object({
  status: z.enum(['approved', 'rejected'], 'Invalid moderation status'),
});

/** Report a resource. */
export const reportResourceSchema = z.object({
  reason: z.string().trim().min(3, 'Please provide a reason').max(300),
  details: z.string().trim().max(1000).optional().or(z.literal('')),
});
