import { Schema, model } from 'mongoose';
import { JOB_STATUSES, JOB_TYPES, WORK_MODES } from '../config/constants.js';

const jobSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 150 },
    company: { type: String, required: true, trim: true, maxlength: 150, index: true },
    type: { type: String, enum: JOB_TYPES, default: 'job', index: true },
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 5000 },
    location: { type: String, trim: true, maxlength: 150, default: '', index: true },
    workMode: { type: String, enum: WORK_MODES, default: 'onsite', index: true },
    salary: { type: String, trim: true, maxlength: 120, default: '' },
    experience: { type: String, trim: true, maxlength: 120, default: '' },
    skills: { type: [String], default: [], index: true },
    eligibility: { type: String, trim: true, maxlength: 1000, default: '' },
    deadline: { type: Date, index: true },
    applicationLink: { type: String, trim: true, maxlength: 500, default: '' },
    applyThroughPlatform: { type: Boolean, default: false },
    postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: JOB_STATUSES, default: 'pending', index: true },
    isFeatured: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    applicants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true },
);

jobSchema.index({ type: 1, status: 1, createdAt: -1 });
jobSchema.index({ company: 1, status: 1 });
jobSchema.index({ title: 'text', company: 'text' });

export default model('Job', jobSchema);
