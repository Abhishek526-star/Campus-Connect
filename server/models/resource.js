import { Schema, model } from 'mongoose';
import { RESOURCE_CATEGORIES, RESOURCE_FILE_TYPES, RESOURCE_STATUSES } from '../config/constants.js';
import { attachmentSchema } from './subSchemas.js';

const resourceSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 3000, default: '' },
    category: { type: String, enum: RESOURCE_CATEGORIES, required: true, index: true },
    subCategory: { type: String, trim: true, maxlength: 120, default: '' },
    subject: { type: String, trim: true, maxlength: 120, default: '' },
    semester: { type: String, trim: true, maxlength: 20, default: '' },
    fileType: { type: String, enum: RESOURCE_FILE_TYPES, required: true },
    file: { type: attachmentSchema, default: null },
    externalUrl: { type: String, trim: true, maxlength: 500, default: '' },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: RESOURCE_STATUSES, default: 'pending', index: true },
    downloads: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    bookmarks: { type: Number, default: 0 },
    tags: { type: [String], default: [], index: true },
  },
  { timestamps: true },
);

resourceSchema.index({ category: 1, subCategory: 1 });
resourceSchema.index({ status: 1, createdAt: -1 });
resourceSchema.index({ title: 'text', tags: 'text' });

export default model('Resource', resourceSchema);
