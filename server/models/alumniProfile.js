import { Schema, model } from 'mongoose';
import { DEPARTMENTS, INDUSTRIES, MENTORSHIP_AREAS } from '../config/constants.js';
import {
  achievementSchema,
  certificationSchema,
  educationSchema,
  experienceSchema,
  projectSchema,
} from './subSchemas.js';

const alumniProfileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    graduationYear: { type: Number, required: true, min: 1950, max: 2100, index: true },
    department: { type: String, enum: DEPARTMENTS, required: true, index: true },
    degree: { type: String, required: true, trim: true, maxlength: 120 },
    currentCompany: { type: String, trim: true, maxlength: 150, default: '', index: true },
    designation: { type: String, trim: true, maxlength: 150, default: '' },
    industry: { type: String, enum: INDUSTRIES, default: '', index: true },
    skills: { type: [String], default: [], index: true },
    location: { type: String, trim: true, maxlength: 120, default: '', index: true },
    about: { type: String, trim: true, maxlength: 2000, default: '' },
    linkedinUrl: { type: String, trim: true, maxlength: 500, default: '' },
    githubUrl: { type: String, trim: true, maxlength: 500, default: '' },
    portfolioUrl: { type: String, trim: true, maxlength: 500, default: '' },
    education: { type: [educationSchema], default: [] },
    experience: { type: [experienceSchema], default: [] },
    achievements: { type: [achievementSchema], default: [] },
    projects: { type: [projectSchema], default: [] },
    certifications: { type: [certificationSchema], default: [] },
    mentorshipAreas: { type: [String], enum: MENTORSHIP_AREAS, default: [] },
    availableForMentorship: { type: Boolean, default: false },
  },
  { timestamps: true },
);

alumniProfileSchema.index({ department: 1, graduationYear: 1 });
alumniProfileSchema.index({ company: 1, designation: 1 });

export default model('AlumniProfile', alumniProfileSchema);
