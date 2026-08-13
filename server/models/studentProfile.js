import { Schema, model } from 'mongoose';
import { DEPARTMENTS } from '../config/constants.js';
import {
  achievementSchema,
  certificationSchema,
  educationSchema,
  experienceSchema,
  projectSchema,
  socialLinksSchema,
} from './subSchemas.js';

const studentProfileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    rollNumber: { type: String, required: true, trim: true, maxlength: 20 },
    department: { type: String, enum: DEPARTMENTS, required: true, index: true },
    course: { type: String, required: true, trim: true, maxlength: 80 },
    year: { type: Number, required: true, min: 1, max: 6 },
    graduationYear: { type: Number, required: true, min: 2000, max: 2100, index: true },
    about: { type: String, trim: true, maxlength: 2000, default: '' },
    location: { type: String, trim: true, maxlength: 120, default: '' },
    skills: { type: [String], default: [], index: true },
    education: { type: [educationSchema], default: [] },
    experience: { type: [experienceSchema], default: [] },
    achievements: { type: [achievementSchema], default: [] },
    projects: { type: [projectSchema], default: [] },
    certifications: { type: [certificationSchema], default: [] },
    socialLinks: { type: socialLinksSchema, default: () => ({}) },
  },
  { timestamps: true },
);

studentProfileSchema.index({ department: 1, graduationYear: 1 });

export default model('StudentProfile', studentProfileSchema);
