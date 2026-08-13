import { Schema, model } from 'mongoose';
import {
  ANNOUNCEMENT_AUDIENCES,
  ANNOUNCEMENT_CATEGORIES,
  ANNOUNCEMENT_STATUSES,
} from '../config/constants.js';

const announcementSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 200 },
    body: { type: String, required: true, trim: true, minlength: 5, maxlength: 5000 },
    category: { type: String, enum: ANNOUNCEMENT_CATEGORIES, default: 'general' },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    audience: { type: String, enum: ANNOUNCEMENT_AUDIENCES, default: 'all', index: true },
    pinned: { type: Boolean, default: false },
    expiresAt: { type: Date },
    status: { type: String, enum: ANNOUNCEMENT_STATUSES, default: 'published' },
  },
  { timestamps: true },
);

announcementSchema.index({ audience: 1, createdAt: -1 });
announcementSchema.index({ pinned: 1, createdAt: -1 });

export default model('Announcement', announcementSchema);
