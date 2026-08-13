import { Schema, model } from 'mongoose';
import { SCHOLARSHIP_APPLICATION_STATUSES } from '../config/constants.js';
import { attachmentSchema, reviewCommentSchema } from './subSchemas.js';

const scholarshipApplicationSchema = new Schema(
  {
    scholarship: { type: Schema.Types.ObjectId, ref: 'Scholarship', required: true },
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rollNumber: { type: String, required: true, trim: true, maxlength: 20 },
    department: { type: String, required: true, trim: true, maxlength: 80 },
    familyIncome: { type: Number, required: true, min: 0 }, // annual family income (INR)
    academicPerformance: { type: Number, required: true, min: 0, max: 100 }, // percentage / CGPA*10
    reason: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
    documents: { type: [attachmentSchema], required: true, validate: [(v) => v.length >= 1, 'At least one document is required'] },
    status: { type: String, enum: SCHOLARSHIP_APPLICATION_STATUSES, default: 'applied', index: true },
    reviewComments: { type: [reviewCommentSchema], default: [] },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    approvedAmount: { type: Number, min: 0 },
  },
  { timestamps: true },
);

scholarshipApplicationSchema.index({ scholarship: 1, student: 1 }, { unique: true });
scholarshipApplicationSchema.index({ student: 1, status: 1 });
scholarshipApplicationSchema.index({ status: 1, createdAt: -1 });

export default model('ScholarshipApplication', scholarshipApplicationSchema);
