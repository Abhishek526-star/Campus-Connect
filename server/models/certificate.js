import { Schema, model } from 'mongoose';
import { attachmentSchema } from './subSchemas.js';

const certificateSchema = new Schema(
  {
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    certificateId: { type: String, required: true, unique: true },
    pdf: { type: attachmentSchema, default: null },
    qrCode: { type: String, default: '' }, // data URL / public id
    issuedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

certificateSchema.index({ event: 1, user: 1 }, { unique: true });
certificateSchema.index({ user: 1 });

export default model('Certificate', certificateSchema);
