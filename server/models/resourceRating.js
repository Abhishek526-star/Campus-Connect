import { Schema, model } from 'mongoose';

const resourceRatingSchema = new Schema(
  {
    resource: { type: Schema.Types.ObjectId, ref: 'Resource', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
  },
  { timestamps: true },
);

resourceRatingSchema.index({ resource: 1, user: 1 }, { unique: true });

export default model('ResourceRating', resourceRatingSchema);
