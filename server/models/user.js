import { Schema, model } from 'mongoose';
import {
  BADGES,
  PRIVACY_LEVELS,
  ROLES,
} from '../config/constants.js';

const privacySchema = new Schema(
  {
    phone: { type: String, enum: PRIVACY_LEVELS, default: 'public' },
    email: { type: String, enum: PRIVACY_LEVELS, default: 'connections' },
    location: { type: String, enum: PRIVACY_LEVELS, default: 'public' },
    company: { type: String, enum: PRIVACY_LEVELS, default: 'public' },
    socialLinks: { type: String, enum: PRIVACY_LEVELS, default: 'connections' },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      maxlength: 254,
    },
    passwordHash: { type: String, required: false, select: false, default: null },
    role: { type: String, enum: ROLES, required: true, index: true },

    avatar: { url: { type: String, default: '' }, publicId: { type: String, default: '' } },
    phone: { type: String, trim: true, maxlength: 20, default: '' },

    isVerified: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    verificationTokenHash: { type: String, select: false },
    verificationTokenExpiresAt: { type: Date },
    resetTokenHash: { type: String, select: false },
    resetTokenExpiresAt: { type: Date },

    lastLoginAt: { type: Date },

    // Google (OAuth) sign-in link — present only for Google-created or
    // Google-linked accounts. Sparse unique: one Google account per user.
    googleId: { type: String, default: null },

    badges: { type: [String], enum: BADGES, default: [] },
    reputationScore: { type: Number, default: 0, min: 0, max: 100000 },

    privacy: { type: privacySchema, default: () => ({}) },
    emailNotifications: { type: Boolean, default: true },

    blockedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.verificationTokenHash;
        delete ret.resetTokenHash;
        return ret;
      },
    },
  },
);

userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ role: 1, isApproved: 1, isVerified: 1, createdAt: -1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ name: 'text' });
// Partial index: only documents that actually HAVE a Google id are indexed,
// so non-Google users (googleId: null) never collide.
userSchema.index({ googleId: 1 }, { unique: true, partialFilterExpression: { googleId: { $type: 'string' } } });

export default model('User', userSchema);
