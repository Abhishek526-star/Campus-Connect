import { Schema, model } from 'mongoose';
import { DONATION_STATUSES, PAYMENT_GATEWAYS, PAYMENT_PURPOSES } from '../config/constants.js';

const paymentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    purpose: { type: String, enum: PAYMENT_PURPOSES, default: 'donation' },
    referenceId: { type: Schema.Types.ObjectId }, // e.g. Donation id
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'INR' },
    gateway: { type: String, enum: PAYMENT_GATEWAYS, default: 'razorpay' },
    orderId: { type: String, unique: true, sparse: true, index: true },
    paymentId: { type: String, index: true },
    signature: { type: String },
    status: { type: String, enum: DONATION_STATUSES, default: 'created', index: true },
    failureReason: { type: String, default: '' },
    refundId: { type: String },
    webhookEvents: { type: [String], default: [] },
  },
  { timestamps: true },
);

paymentSchema.index({ user: 1, createdAt: -1 });

export default model('Payment', paymentSchema);
