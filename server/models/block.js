import { Schema, model } from 'mongoose';

const blockSchema = new Schema(
  {
    blocker: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    blocked: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

blockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

export default model('Block', blockSchema);
