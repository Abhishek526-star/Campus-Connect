import { Schema, model } from 'mongoose';
import { attachmentSchema } from './subSchemas.js';

const messageSchema = new Schema(
  {
    conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    kind: { type: String, enum: ['text', 'file', 'image'], default: 'text' },
    content: { type: String, trim: true, maxlength: 5000, default: '' },
    attachment: { type: attachmentSchema, default: null },
    isRead: { type: Boolean, default: false },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    deletedFor: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    editedAt: { type: Date },
  },
  { timestamps: true },
);

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });

export default model('Message', messageSchema);
