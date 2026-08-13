import { Schema, model } from 'mongoose';
import { MENTORSHIP_SESSION_STATUSES } from '../config/constants.js';

const mentorshipSessionSchema = new Schema(
  {
    mentorship: { type: Schema.Types.ObjectId, ref: 'Mentorship', required: true, index: true },
    meeting: { type: Schema.Types.ObjectId, ref: 'Meeting', default: null },
    scheduledAt: { type: Date, required: true },
    notes: { type: String, trim: true, maxlength: 2000, default: '' },
    status: { type: String, enum: MENTORSHIP_SESSION_STATUSES, default: 'scheduled' },
  },
  { timestamps: true },
);

export default model('MentorshipSession', mentorshipSessionSchema);
