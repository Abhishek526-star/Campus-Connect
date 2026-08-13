import { Schema, model } from 'mongoose';
import { MEETING_STATUSES, MEETING_TYPES } from '../config/constants.js';

const meetingSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 150 },
    organizer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true, index: true },
    startTime: { type: String, required: true, trim: true, maxlength: 10 }, // HH:mm
    endTime: { type: String, trim: true, maxlength: 10, default: '' },
    type: { type: String, enum: MEETING_TYPES, default: 'one_on_one' },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    location: { type: String, trim: true, maxlength: 200, default: '' },
    meetingLink: { type: String, trim: true, maxlength: 500, default: '' },
    status: { type: String, enum: MEETING_STATUSES, default: 'scheduled', index: true },
  },
  { timestamps: true },
);

meetingSchema.index({ organizer: 1, status: 1 });
meetingSchema.index({ date: -1 });

export default model('Meeting', meetingSchema);
