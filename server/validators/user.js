import { z } from 'zod';
import { DEPARTMENTS, INDUSTRIES, MENTORSHIP_AREAS, PRIVACY_LEVELS } from '../config/constants.js';

const urlField = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || /^https?:\/\//.test(v), 'Enter a valid URL (https://…)')
  .optional()
  .or(z.literal(''));

const text = (max, min = 0) => (min > 0 ? z.string().trim().min(min).max(max) : z.string().trim().max(max).optional().or(z.literal('')));

const educationItem = z.object({
  degree: z.string().trim().min(1, 'Degree is required').max(120),
  institution: text(200),
  fieldOfStudy: text(120),
  startYear: z.coerce.number().int().min(1950).max(2100).optional(),
  endYear: z.coerce.number().int().min(1950).max(2100).optional(),
  grade: text(40),
  description: text(1000),
});

const experienceItem = z.object({
  company: z.string().trim().min(1, 'Company is required').max(150),
  title: z.string().trim().min(1, 'Title is required').max(150),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
  current: z.boolean().optional(),
  description: text(2000),
});

const achievementItem = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: text(1000),
  date: z.string().optional().or(z.literal('')),
  link: urlField,
});

const projectItem = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: text(2000),
  techStack: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
  link: urlField,
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
});

const certificationItem = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  issuer: text(150),
  date: z.string().optional().or(z.literal('')),
  credentialId: text(120),
  link: urlField,
});

const skillList = z.array(z.string().trim().min(1).max(60)).max(30).optional();

/** Update basic user fields. */
export const updateBasicsSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80).optional(),
    phone: z
      .string()
      .regex(/^$|^[+\d][\d\s-]{7,17}$/, 'Enter a valid phone number')
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Provide at least one field to update' });

/** Role-profile update — all fields optional; service whitelists per role. */
export const updateRoleProfileSchema = z.object({
  // common
  about: text(2000),
  location: text(120),
  skills: skillList,
  education: z.array(educationItem).max(20).optional(),
  experience: z.array(experienceItem).max(20).optional(),
  achievements: z.array(achievementItem).max(20).optional(),
  projects: z.array(projectItem).max(20).optional(),
  certifications: z.array(certificationItem).max(20).optional(),
  socialLinks: z
    .object({
      linkedin: urlField,
      github: urlField,
      portfolio: urlField,
    })
    .optional(),

  // student
  rollNumber: z.string().trim().min(2).max(20).optional(),
  course: z.string().trim().min(2).max(80).optional(),
  year: z.coerce.number().int().min(1).max(6).optional(),
  graduationYear: z.coerce.number().int().min(1950).max(2100).optional(),

  // faculty
  designation: z.string().trim().min(2).max(120).optional(),
  subjects: skillList,

  // alumni
  degree: z.string().trim().min(2).max(120).optional(),
  currentCompany: text(150),
  industry: z.enum([...INDUSTRIES, ''], 'Select a valid industry').optional(),
  mentorshipAreas: z.array(z.enum(MENTORSHIP_AREAS)).max(8).optional(),
  availableForMentorship: z.boolean().optional(),
});

/** Per-field privacy settings (spec §41). */
export const privacySchema = z
  .object({
    phone: z.enum(PRIVACY_LEVELS).optional(),
    email: z.enum(PRIVACY_LEVELS).optional(),
    location: z.enum(PRIVACY_LEVELS).optional(),
    company: z.enum(PRIVACY_LEVELS).optional(),
    socialLinks: z.enum(PRIVACY_LEVELS).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Provide at least one privacy field' });

/** For validating department in profile updates (kept consistent). */
export { DEPARTMENTS };
