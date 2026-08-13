import { Schema, model } from 'mongoose';
import { REGISTRATION_STATUSES } from '../config/constants.js';

const eventRegistrationSchema = new Schema(
  {
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: REGISTRATION_STATUSES, default: 'registered', index: true },
    attendedAt: { type: Date },
  },
  { timestamps: true },
);

// One registration per user per event.
eventRegistrationSchema.index({ event: 1, user: 1 }, { unique: true });
eventRegistrationSchema.index({ event: 1, status: 1 });

export default model('EventRegistration', eventRegistrationSchema);
