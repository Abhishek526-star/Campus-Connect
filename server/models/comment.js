import { Schema, model } from 'mongoose';
import { COMMENT_STATUSES } from '../config/constants.js';

const commentSchema = new Schema(
  {
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    parent: { type: Schema.Types.ObjectId, ref: 'Comment', default: null }, // reply support
    content: { type: String, required: true, trim: true, minlength: 1, maxlength: 2000 },
    likesCount: { type: Number, default: 0 },
    status: { type: String, enum: COMMENT_STATUSES, default: 'published' },
  },
  { timestamps: true },
);

commentSchema.index({ post: 1, createdAt: 1 });

export default model('Comment', commentSchema);
