import { Schema, model } from 'mongoose';
import { DONATION_STATUSES } from '../config/constants.js';

const donationSchema = new Schema(
  {
    donor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    scholarship: { type: Schema.Types.ObjectId, ref: 'Scholarship', index: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'INR' },
    orderId: { type: String, index: true },
    paymentId: { type: String },
    signature: { type: String },
    status: { type: String, enum: DONATION_STATUSES, default: 'created', index: true },
    receiptNumber: { type: String, unique: true, sparse: true },
    receiptUrl: { type: String, default: '' },
    message: { type: String, trim: true, maxlength: 500, default: '' },
    anonymous: { type: Boolean, default: false },
  },
  { timestamps: true },
);

donationSchema.index({ donor: 1, createdAt: -1 });
donationSchema.index({ scholarship: 1, status: 1 });

export default model('Donation', donationSchema);
