import { Schema, model } from 'mongoose';
import { ROADMAP_ROLES } from '../config/constants.js';

const roadmapStepSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    duration: { type: String, trim: true, maxlength: 80, default: '' },
    resources: { type: [String], default: [] },
  },
  { _id: true },
);

const careerRoadmapSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 200 },
    role: { type: String, enum: ROADMAP_ROLES, required: true, unique: true },
    description: { type: String, trim: true, maxlength: 3000, default: '' },
    steps: { type: [roadmapStepSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

export default model('CareerRoadmap', careerRoadmapSchema);
