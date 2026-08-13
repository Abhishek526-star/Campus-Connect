import { Schema } from 'mongoose';

/**
 * Shared sub-schemas — reused across profiles and content models to avoid
 * data duplication and keep validation consistent.
 */

export const attachmentSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: null },
    name: { type: String, trim: true, maxlength: 255 },
    mimeType: { type: String, default: 'application/octet-stream' },
    size: { type: Number, default: 0 },
  },
  { _id: false },
);

export const socialLinksSchema = new Schema(
  {
    linkedin: { type: String, trim: true, maxlength: 500, default: '' },
    github: { type: String, trim: true, maxlength: 500, default: '' },
    portfolio: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { _id: false },
);

export const educationSchema = new Schema(
  {
    degree: { type: String, required: true, trim: true, maxlength: 120 },
    institution: { type: String, trim: true, maxlength: 200, default: '' },
    fieldOfStudy: { type: String, trim: true, maxlength: 120, default: '' },
    startYear: { type: Number, min: 1950, max: 2100 },
    endYear: { type: Number, min: 1950, max: 2100 },
    grade: { type: String, trim: true, maxlength: 40, default: '' },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
  },
  { _id: true },
);

export const experienceSchema = new Schema(
  {
    company: { type: String, required: true, trim: true, maxlength: 150 },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    startDate: { type: Date },
    endDate: { type: Date },
    current: { type: Boolean, default: false },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
  },
  { _id: true },
);

export const achievementSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    date: { type: Date },
    link: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { _id: true },
);

export const projectSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    techStack: [{ type: String, trim: true, maxlength: 60 }],
    link: { type: String, trim: true, maxlength: 500, default: '' },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { _id: true },
);

export const certificationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    issuer: { type: String, trim: true, maxlength: 150, default: '' },
    date: { type: Date },
    credentialId: { type: String, trim: true, maxlength: 120, default: '' },
    link: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { _id: true },
);

export const reviewCommentSchema = new Schema(
  {
    by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    at: { type: Date, default: Date.now },
  },
  { _id: true },
);
