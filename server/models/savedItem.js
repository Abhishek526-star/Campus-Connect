import { Schema, model } from 'mongoose';
import { SAVED_ITEM_TYPES } from '../config/constants.js';

const savedItemSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    itemType: { type: String, enum: SAVED_ITEM_TYPES, required: true },
    itemId: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: true },
);

savedItemSchema.index({ user: 1, itemType: 1, itemId: 1 }, { unique: true });

export default model('SavedItem', savedItemSchema);
