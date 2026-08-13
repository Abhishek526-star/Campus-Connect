import { z } from 'zod';
import { DEPARTMENTS } from '../config/constants.js';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters');

const phoneSchema = z
  .string()
  .regex(/^[+\d][\d\s-]{7,17}$/, 'Please provide a valid phone number')
  .optional()
  .or(z.literal(''));

const baseFields = {
  name: z.string().trim().min(2, 'Name is required').max(80, 'Name is too long'),
  email: z.email('Please provide a valid email address'),
  password: passwordSchema,
};

/** Registration payloads are role-specific (spec §3). */
export const registerSchema = z.discriminatedUnion('role', [
  z.object({
    role: z.literal('student'),
    ...baseFields,
    rollNumber: z.string().trim().min(2, 'Roll number is required').max(20),
    department: z.enum(DEPARTMENTS, 'Select a valid department'),
    course: z.string().trim().min(2, 'Course is required').max(80),
    year: z.coerce.number().int().min(1, 'Year must be between 1 and 6').max(6),
    graduationYear: z.coerce.number().int().min(2000).max(2100),
    phone: phoneSchema,
  }),
  z.object({
    role: z.literal('faculty'),
    ...baseFields,
    employeeId: z.string().trim().min(2, 'Employee ID is required').max(20),
    department: z.enum(DEPARTMENTS, 'Select a valid department'),
    designation: z.string().trim().min(2, 'Designation is required').max(120),
  }),
  z.object({
    role: z.literal('alumni'),
    ...baseFields,
    graduationYear: z.coerce.number().int().min(1950).max(2100),
    department: z.enum(DEPARTMENTS, 'Select a valid department'),
    degree: z.string().trim().min(2, 'Degree is required').max(120),
    currentCompany: z.string().trim().max(150).optional().or(z.literal('')),
    designation: z.string().trim().max(150).optional().or(z.literal('')),
  }),
]);

export const loginSchema = z.object({
  email: z.email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required').max(128),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(10, 'Invalid verification token').max(256),
});

export const resendVerificationSchema = z.object({
  email: z.email('Please provide a valid email address'),
});

export const forgotPasswordSchema = z.object({
  email: z.email('Please provide a valid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Invalid reset token').max(256),
  password: passwordSchema,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required').max(128),
    newPassword: passwordSchema,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from the current password',
    path: ['newPassword'],
  });
