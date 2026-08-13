import { Schema, model } from 'mongoose';
import { REFERRAL_STATUSES } from '../config/constants.js';

const referralSchema = new Schema(
  {
    alumnus: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    student: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    note: { type: String, trim: true, maxlength: 1000, default: '' },
    status: { type: String, enum: REFERRAL_STATUSES, default: 'requested', index: true },
  },
  { timestamps: true },
);

referralSchema.index({ alumnus: 1, job: 1, student: 1 }, { unique: true, sparse: true });
referralSchema.index({ student: 1, status: 1 });

export default model('Referral', referralSchema);
