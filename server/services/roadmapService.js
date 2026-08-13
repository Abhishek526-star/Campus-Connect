import CareerRoadmap from '../models/careerRoadmap.js';
import { notFound } from '../utils/ApiError.js';

/**
 * Career roadmaps (spec §29): step-by-step guides for 9 roles, seeded with
 * realistic content and extendable by admins.
 */

export async function listRoadmaps() {
  const items = await CareerRoadmap.find({}).sort({ role: 1 }).lean();
  return items;
}

export async function getRoadmapByRole({ role }) {
  const roadmap = await CareerRoadmap.findOne({ role }).lean();
  if (!roadmap) throw notFound('Roadmap not found', 'ROADMAP_NOT_FOUND');
  return roadmap;
}

/** Create/update a roadmap (admin). */
export async function upsertRoadmap({ role, data, userId }) {
  const roadmap = await CareerRoadmap.findOneAndUpdate(
    { role },
    { $set: { ...data, role, createdBy: userId } },
    { new: true, upsert: true, runValidators: true },
  );
  return roadmap;
}

