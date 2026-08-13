import { Schema, model } from 'mongoose';
import { CONNECTION_STATUSES } from '../config/constants.js';

const connectionSchema = new Schema(
  {
    requester: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: CONNECTION_STATUSES, default: 'pending', index: true },
    respondedAt: { type: Date },
  },
  { timestamps: true },
);

// A connection pair can only exist once (regardless of direction).
connectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });
connectionSchema.index({ recipient: 1, status: 1, createdAt: -1 });
connectionSchema.index({ requester: 1, status: 1, createdAt: -1 });

export default model('Connection', connectionSchema);
