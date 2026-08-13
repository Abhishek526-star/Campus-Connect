import { Schema, model } from 'mongoose';
import {
  DEPARTMENTS,
  EVENT_CATEGORIES,
  EVENT_MODES,
  EVENT_STATUSES,
} from '../config/constants.js';
import { attachmentSchema } from './subSchemas.js';

const eventSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 150 },
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 5000 },
    organizer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true, index: true },
    startTime: { type: String, trim: true, maxlength: 10, default: '' }, // HH:mm (24h)
    endTime: { type: String, trim: true, maxlength: 10, default: '' },
    venue: { type: String, trim: true, maxlength: 200, default: '' },
    mode: { type: String, enum: EVENT_MODES, default: 'offline' },
    meetingLink: { type: String, trim: true, maxlength: 500, default: '' },
    maxParticipants: { type: Number, min: 1, default: 100 },
    registrationDeadline: { type: Date },
    image: { type: attachmentSchema, default: null },
    department: { type: String, enum: [...DEPARTMENTS, ''], default: '', index: true },
    category: { type: String, enum: EVENT_CATEGORIES, required: true, index: true },
    status: { type: String, enum: EVENT_STATUSES, default: 'published', index: true },
    registrationsCount: { type: Number, default: 0 },
    // Rotating QR attendance secret (attendance module). Only the hash is stored.
    qr: {
      secretHash: { type: String, select: false },
      expiresAt: { type: Date },
    },
  },
  { timestamps: true },
);

eventSchema.index({ status: 1, date: 1 });
eventSchema.index({ category: 1, department: 1 });
eventSchema.index({ date: -1 });

export default model('Event', eventSchema);
