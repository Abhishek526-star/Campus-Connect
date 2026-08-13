import Resource from '../models/resource.js';
import ResourceRating from '../models/resourceRating.js';
import SavedItem from '../models/savedItem.js';
import Report from '../models/report.js';
import User from '../models/user.js';
import { badRequest, conflict, forbidden, notFound } from '../utils/ApiError.js';
import { paginationMeta } from '../utils/pagination.js';
import { createNotification } from './notificationService.js';
import { logAudit } from '../utils/audit.js';
import { deleteFile } from './uploadService.js';
import { awardReputation } from './certificateService.js';

const UPLOADER_POPULATE = { path: 'uploadedBy', select: 'name avatar role badges' };
const UPLOADER_ROLES = ['faculty', 'alumni', 'admin'];
const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function canManage(resource, user) {
  return user.role === 'admin' || String(resource.uploadedBy) === String(user._id);
}

/**
 * Resource library (spec §15): GATE / Semester / Placement Preparation /
 * Development / Other Exams. Approved resources are public; uploads start
 * as pending until an admin approves.
 */
export async function listResources({ viewerId, filters = {}, page, limit, sort }) {
  const query = {};

  if (filters.includeMine === 'true' && viewerId) {
    // Poster's own view (any status).
    query.uploadedBy = viewerId;
  } else if (filters.includePending === 'true' && viewerId) {
    // Admin moderation view.
    query.status = { $in: ['pending', 'approved', 'rejected', 'removed'] };
    if (filters.status) query.status = filters.status;
  } else {
    query.status = 'approved';
  }

  if (filters.category && filters.category !== 'all') query.category = filters.category;
  if (filters.subCategory) query.subCategory = filters.subCategory;
  if (filters.subject) query.subject = { $regex: escapeRegExp(filters.subject), $options: 'i' };
  if (filters.semester) query.semester = filters.semester;
  if (filters.search) {
    query.$or = [
      { title: { $regex: escapeRegExp(filters.search), $options: 'i' } },
      { description: { $regex: escapeRegExp(filters.search), $options: 'i' } },
      { tags: { $regex: escapeRegExp(filters.search), $options: 'i' } },
    ];
  }

  const sortOptions = {
    newest: { createdAt: -1 },
    rating: { avgRating: -1, ratingCount: -1 },
    downloads: { downloads: -1 },
    title: { title: 1 },
  }[sort] ?? { createdAt: -1 };

  const [items, total] = await Promise.all([
    Resource.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('title description category subCategory subject semester fileType file externalUrl uploadedBy status downloads avgRating ratingCount tags createdAt')
      .populate(UPLOADER_POPULATE)
      .lean(),
    Resource.countDocuments(query),
  ]);

  // Viewer state: bookmarked + my rating.
  let savedIds = new Set();
  let myRatings = new Map();
  if (viewerId) {
    const [saved, ratings] = await Promise.all([
      SavedItem.find({ user: viewerId, itemType: 'resource' }).select('itemId').lean(),
      ResourceRating.find({ user: viewerId, resource: { $in: items.map((i) => i._id) } }).select('resource rating').lean(),
    ]);
    savedIds = new Set(saved.map((s) => String(s.itemId)));
    ratings.forEach((r) => myRatings.set(String(r.resource), r.rating));
  }

  return {
    items: items.map((resource) => ({
      ...resource,
      isBookmarked: savedIds.has(String(resource._id)),
      myRating: myRatings.get(String(resource._id)) ?? null,
    })),
    meta: paginationMeta(total, page, limit),
  };
}

/** Single resource + viewer state. */
export async function getResourceById({ resourceId, userId }) {
  const resource = await Resource.findById(resourceId).populate(UPLOADER_POPULATE).lean();
  if (!resource) throw notFound('Resource not found', 'RESOURCE_NOT_FOUND');
  if (resource.status !== 'approved' && !(userId && canManage(resource, { _id: userId, role: (await User.findById(userId).select('role').lean())?.role }))) {
    throw notFound('Resource not found', 'RESOURCE_NOT_FOUND');
  }

  const [saved, rating] = await Promise.all([
    userId ? SavedItem.exists({ user: userId, itemType: 'resource', itemId: resourceId }) : false,
    userId ? ResourceRating.findOne({ user: userId, resource: resourceId }).select('rating').lean() : null,
  ]);

  return { resource: { ...resource, isBookmarked: Boolean(saved), myRating: rating?.rating ?? null } };
}

/** Upload a resource (faculty/alumni/admin) — status pending for moderation. */
export async function createResource({ data, userId, role, _req }) {
  if (!UPLOADER_ROLES.includes(role)) {
    throw forbidden('Only faculty, alumni, and administrators can upload resources', 'RESOURCE_UPLOAD_FORBIDDEN');
  }
  const resource = await Resource.create({
    ...data,
    uploadedBy: userId,
    status: 'pending',
  });

  const uploader = await User.findById(userId).select('name');
  // Notify admins of the pending upload (moderation queue).
  const admins = await User.find({ role: 'admin', isActive: true }).select('_id').lean();
  await Promise.all(
    admins.map((admin) =>
      createNotification({
        recipientId: admin._id,
        type: 'new_resource',
        title: 'Resource pending approval',
        body: `${uploader?.name ?? 'Someone'} uploaded "${resource.title}"`,
        data: { url: '/admin/content', resourceId: resource._id },
      }),
    ),
  );

  await logAudit({
    action: 'resource_delete',
    actorId: userId,
    targetType: 'resource',
    targetId: resource._id,
    details: { action: 'create', title: resource.title },
    req: _req,
  });
  return resource;
}

/** Update (owner/admin). */
export async function updateResource({ resourceId, data, userId, role, _req }) {
  const resource = await Resource.findById(resourceId);
  if (!resource) throw notFound('Resource not found', 'RESOURCE_NOT_FOUND');
  if (!canManage(resource, { _id: userId, role })) {
    throw forbidden('Only the uploader or an admin can edit this resource', 'RESOURCE_UPDATE_FORBIDDEN');
  }
  Object.assign(resource, data);
  await resource.save();
  return resource;
}

/** Delete (owner/admin) — removes the stored file too. */
export async function deleteResource({ resourceId, userId, role, req }) {
  const resource = await Resource.findById(resourceId);
  if (!resource) throw notFound('Resource not found', 'RESOURCE_NOT_FOUND');
  if (!canManage(resource, { _id: userId, role })) {
    throw forbidden('Only the uploader or an admin can delete this resource', 'RESOURCE_DELETE_FORBIDDEN');
  }

  if (resource.file?.publicId || resource.file?.url?.startsWith('/uploads/')) {
    try {
      await deleteFile({ publicId: resource.file.publicId, url: resource.file.url });
    } catch {
      // best-effort
    }
  }
  await SavedItem.deleteMany({ itemType: 'resource', itemId: resourceId });
  await ResourceRating.deleteMany({ resource: resourceId });
  await Resource.deleteOne({ _id: resourceId });

  await logAudit({
    action: 'resource_delete',
    actorId: userId,
    targetType: 'resource',
    targetId: resourceId,
    details: { title: resource.title },
    req,
  });
}

/** Rate 1–5 — recomputes the resource average. */
export async function rateResource({ resourceId, userId, rating }) {
  const resource = await Resource.findById(resourceId).select('_id avgRating ratingCount');
  if (!resource) throw notFound('Resource not found', 'RESOURCE_NOT_FOUND');

  const existing = await ResourceRating.findOne({ resource: resourceId, user: userId });
  if (existing) {
    // Update: adjust the average.
    existing.rating = rating;
    await existing.save();
    const all = await ResourceRating.find({ resource: resourceId }).select('rating').lean();
    resource.avgRating = all.reduce((sum, r) => sum + r.rating, 0) / all.length;
    resource.ratingCount = all.length;
  } else {
    await ResourceRating.create({ resource: resourceId, user: userId, rating });
    resource.avgRating = ((resource.avgRating ?? 0) * (resource.ratingCount ?? 0) + rating) / ((resource.ratingCount ?? 0) + 1);
    resource.ratingCount = (resource.ratingCount ?? 0) + 1;
  }
  await resource.save();
  return { avgRating: Math.round(resource.avgRating * 100) / 100, ratingCount: resource.ratingCount, myRating: rating };
}

/** Bookmark (spec §15). */
export async function bookmarkResource({ resourceId, userId }) {
  const resource = await Resource.findById(resourceId).select('_id');
  if (!resource) throw notFound('Resource not found', 'RESOURCE_NOT_FOUND');
  const saved = await SavedItem.findOneAndUpdate(
    { user: userId, itemType: 'resource', itemId: resourceId },
    { $setOnInsert: { user: userId, itemType: 'resource', itemId: resourceId } },
    { upsert: true, new: true },
  );
  await Resource.updateOne({ _id: resourceId }, { $inc: { bookmarks: 1 } }).catch(() => {});
  return saved;
}

export async function unbookmarkResource({ resourceId, userId }) {
  await SavedItem.deleteOne({ user: userId, itemType: 'resource', itemId: resourceId });
  await Resource.updateOne({ _id: resourceId }, { $inc: { bookmarks: -1 } }).catch(() => {});
}

/** Viewer's bookmarks. */
export async function listBookmarkedResources({ userId }) {
  const saved = await SavedItem.find({ user: userId, itemType: 'resource' }).sort({ createdAt: -1 }).select('itemId').lean();
  const ids = saved.map((s) => s.itemId);
  if (ids.length === 0) return [];
  const resources = await Resource.find({ _id: { $in: ids }, status: 'approved' })
    .populate(UPLOADER_POPULATE)
    .lean();
  return resources.map((resource) => ({ ...resource, isBookmarked: true }));
}

/** Download — increments the counter, returns the file URL (or external link). */
export async function downloadResource({ resourceId, _userId }) {
  const resource = await Resource.findByIdAndUpdate(resourceId, { $inc: { downloads: 1 } }, { new: true }).lean();
  if (!resource) throw notFound('Resource not found', 'RESOURCE_NOT_FOUND');
  if (resource.status !== 'approved') throw badRequest('This resource is not available', 'RESOURCE_NOT_AVAILABLE');
  return { url: resource.file?.url ?? resource.externalUrl, title: resource.title, external: resource.fileType === 'external' };
}

/** Report a resource. */
export async function reportResource({ resourceId, userId, reason, details }) {
  const resource = await Resource.findById(resourceId).select('_id');
  if (!resource) throw notFound('Resource not found', 'RESOURCE_NOT_FOUND');
  const existing = await Report.findOne({ reporter: userId, targetType: 'resource', targetId: resourceId, status: 'pending' });
  if (existing) throw conflict('You have already reported this resource', 'ALREADY_REPORTED');
  await Report.create({ reporter: userId, targetType: 'resource', targetId: resourceId, reason, details });
}

/** Admin moderation: approve/reject + notify uploader. */
export async function moderateResource({ resourceId, status, userId, role, req }) {
  if (role !== 'admin') throw forbidden('Only administrators can moderate resources', 'MODERATE_FORBIDDEN');
  const resource = await Resource.findById(resourceId);
  if (!resource) throw notFound('Resource not found', 'RESOURCE_NOT_FOUND');

  resource.status = status;
  await resource.save();

  if (status === 'approved') {
    await awardReputation({ userId: resource.uploadedBy, rule: 'resource_upload' });
  }

  await createNotification({
    recipientId: resource.uploadedBy,
    type: 'resource_status',
    title: `Resource ${status}`,
    body: `"${resource.title}" was ${status} by a moderator`,
    data: { url: `/resources/${resourceId}`, resourceId },
  });

  await logAudit({
    action: 'resource_delete',
    actorId: userId,
    targetType: 'resource',
    targetId: resourceId,
    details: { action: 'moderate', status },
    req,
  });
  return resource;
}

/** Category/subcategory tree for filters (spec §15). */
export async function getCategories() {
  const distinct = await Resource.distinct('subCategory', { status: 'approved' });
  return distinct.filter(Boolean).sort();
}
