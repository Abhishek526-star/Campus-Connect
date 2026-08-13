import { Schema, model } from 'mongoose';
import { DEPARTMENTS } from '../config/constants.js';
import { educationSchema, experienceSchema, socialLinksSchema } from './subSchemas.js';

const facultyProfileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    employeeId: { type: String, required: true, trim: true, maxlength: 20, unique: true },
    department: { type: String, enum: DEPARTMENTS, required: true, index: true },
    designation: { type: String, required: true, trim: true, maxlength: 120 },
    subjects: { type: [String], default: [] },
    about: { type: String, trim: true, maxlength: 2000, default: '' },
    location: { type: String, trim: true, maxlength: 120, default: '' },
    education: { type: [educationSchema], default: [] },
    experience: { type: [experienceSchema], default: [] },
    socialLinks: { type: socialLinksSchema, default: () => ({}) },
  },
  { timestamps: true },
);

export default model('FacultyProfile', facultyProfileSchema);
