import { z } from 'zod';
import { DEPARTMENTS } from '../../../constants/index.js';

/**
 * Client-side role-profile schema + helpers (mirrors server validators/user.js).
 * Kept separate so components stay clean for fast-refresh linting.
 */

const urlField = z
  .union([z.literal(''), z.string().trim().max(500).refine((v) => /^https?:\/\//.test(v), 'Enter a valid URL (https://…)')])
  .optional();

const text = (max) => z.union([z.literal(''), z.string().trim().max(max)]).optional();

const yearOpt = z.union([z.literal(''), z.coerce.number().int().min(1950).max(2100)]).optional();

const educationItem = z.object({
  degree: z.string().trim().min(1, 'Degree is required').max(120),
  institution: text(200),
  fieldOfStudy: text(120),
  startYear: yearOpt,
  endYear: yearOpt,
  grade: text(40),
  description: text(1000),
});

const experienceItem = z.object({
  company: z.string().trim().min(1, 'Company is required').max(150),
  title: z.string().trim().min(1, 'Title is required').max(150),
  startDate: text(10),
  endDate: text(10),
  current: z.boolean().optional(),
  description: text(2000),
});

const achievementItem = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: text(1000),
  date: text(10),
  link: urlField,
});

const projectItem = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: text(2000),
  techStack: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
  link: urlField,
  startDate: text(10),
  endDate: text(10),
});

const certificationItem = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  issuer: text(150),
  date: text(10),
  credentialId: text(120),
  link: urlField,
});

const skillList = z.array(z.string().trim().min(1).max(60)).max(30).optional();

export const profileEditSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  phone: z
    .union([z.literal(''), z.string().regex(/^[+\d][\d\s-]{7,17}$/, 'Enter a valid phone number')])
    .optional(),
  // role fields
  rollNumber: text(20),
  department: z.enum(DEPARTMENTS, 'Select a department').optional(),
  course: text(80),
  year: z.union([z.literal(''), z.coerce.number().int().min(1).max(6)]).optional(),
  graduationYear: yearOpt,
  designation: text(120),
  subjects: skillList,
  degree: text(120),
  currentCompany: text(150),
  industry: z.union([z.literal(''), z.string()]).optional(),
  mentorshipAreas: z.array(z.string()).max(8).optional(),
  availableForMentorship: z.boolean().optional(),
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
});

export const PROFILE_FORM_DEFAULTS = {
  education: { degree: '', institution: '', fieldOfStudy: '', startYear: '', endYear: '', grade: '', description: '' },
  experience: { company: '', title: '', startDate: '', endDate: '', current: false, description: '' },
  achievements: { title: '', description: '', date: '', link: '' },
  projects: { title: '', description: '', techStack: [], link: '', startDate: '', endDate: '' },
  certifications: { name: '', issuer: '', date: '', credentialId: '', link: '' },
};

/** Drop empty values so the server never receives '' for optional fields. */
export function cleanPayload(values) {
  const clean = (obj) => {
    const out = {};
    for (const [key, value] of Object.entries(obj ?? {})) {
      if (value === '' || value === null || value === undefined) continue;
      if (Array.isArray(value)) out[key] = value.map((item) => (typeof item === 'object' ? clean(item) : item));
      else if (typeof value === 'object') out[key] = clean(value);
      else out[key] = value;
    }
    return out;
  };
  return clean(values);
}
