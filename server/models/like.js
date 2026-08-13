import { Schema, model } from 'mongoose';
import { LIKE_TARGET_TYPES } from '../config/constants.js';

const likeSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { type: String, enum: LIKE_TARGET_TYPES, required: true },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'targetModel',
    },
    targetModel: { type: String, enum: ['Post', 'Comment'], required: true },
  },
  { timestamps: true },
);

likeSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });
likeSchema.index({ targetType: 1, targetId: 1 });

export default model('Like', likeSchema);
