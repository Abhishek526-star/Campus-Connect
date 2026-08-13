import { Schema, model } from 'mongoose';
import { POST_STATUSES, POST_TYPES } from '../config/constants.js';
import { attachmentSchema } from './subSchemas.js';

const postSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: POST_TYPES, default: 'knowledge', index: true },
    content: { type: String, required: true, trim: true, minlength: 2, maxlength: 5000 },
    images: { type: [attachmentSchema], default: [] },
    documents: { type: [attachmentSchema], default: [] },
    links: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    status: { type: String, enum: POST_STATUSES, default: 'published', index: true },
    counts: {
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      saves: { type: Number, default: 0 },
    },
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true },
);

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ status: 1, createdAt: -1 });
postSchema.index({ type: 1, status: 1 });
postSchema.index({ content: 'text', tags: 'text' });

export default model('Post', postSchema);
