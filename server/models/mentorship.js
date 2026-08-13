import { Schema, model } from 'mongoose';
import { MENTORSHIP_AREAS, MENTORSHIP_STATUSES } from '../config/constants.js';

const mentorshipSchema = new Schema(
  {
    mentor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    area: { type: String, enum: MENTORSHIP_AREAS, required: true },
    message: { type: String, trim: true, maxlength: 1500, default: '' },
    goals: { type: [String], default: [] },
    status: { type: String, enum: MENTORSHIP_STATUSES, default: 'requested', index: true },
  },
  { timestamps: true },
);

mentorshipSchema.index({ mentor: 1, student: 1, area: 1 }, { unique: true });
mentorshipSchema.index({ student: 1, status: 1 });

export default model('Mentorship', mentorshipSchema);
