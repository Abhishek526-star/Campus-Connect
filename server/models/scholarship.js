import { Schema, model } from 'mongoose';
import { SCHOLARSHIP_CATEGORIES, SCHOLARSHIP_STATUSES } from '../config/constants.js';

const scholarshipSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 3, maxlength: 150 },
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 5000 },
    eligibility: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
    minimumRequirements: { type: [String], default: [] },
    maxApplicants: { type: Number, min: 1, default: 50 },
    amount: { type: Number, required: true, min: 1 }, // per-student amount (INR)
    targetAmount: { type: Number, required: true, min: 1 }, // funding target (INR)
    raisedAmount: { type: Number, default: 0, min: 0 },
    deadline: { type: Date, required: true, index: true },
    requiredDocuments: { type: [String], default: [] },
    sponsor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, enum: SCHOLARSHIP_CATEGORIES, default: 'need_based' },
    status: { type: String, enum: SCHOLARSHIP_STATUSES, default: 'active', index: true },
    applicantsCount: { type: Number, default: 0 },
    studentsSupported: { type: Number, default: 0 },
  },
  { timestamps: true },
);

scholarshipSchema.index({ deadline: 1, status: 1 });
scholarshipSchema.index({ status: 1, category: 1 });

export default model('Scholarship', scholarshipSchema);
