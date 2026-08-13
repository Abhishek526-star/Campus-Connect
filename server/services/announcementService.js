import Announcement from '../models/announcement.js';
import User from '../models/user.js';
import { forbidden, notFound } from '../utils/ApiError.js';
import { paginationMeta } from '../utils/pagination.js';
import { createNotification } from './notificationService.js';

const AUTHOR_POPULATE = { path: 'author', select: 'name avatar role' };

/**
 * Announcements (spec §17): faculty/admins publish; audience targeting;
 * auto-notifications on publish.
 */
export async function listAnnouncements({ userId, page, limit }) {
  const user = await User.findById(userId).select('role').lean();
  const query = {
    status: 'published',
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    $and: [{ $or: [{ audience: 'all' }, { audience: user.role }, { author: userId }] }],
  };

  const [items, total] = await Promise.all([
    Announcement.find(query)
      .sort({ pinned: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(AUTHOR_POPULATE)
      .lean(),
    Announcement.countDocuments(query),
  ]);

  return { items, meta: paginationMeta(total, page, limit) };
}

/** Create (faculty/admin — spec §2, §17). */
export async function createAnnouncement({ data, userId, role }) {
  if (!['faculty', 'admin'].includes(role)) {
    throw forbidden('Only faculty and administrators can publish announcements', 'ANNOUNCEMENT_FORBIDDEN');
  }

  const announcement = await Announcement.create({
    ...data,
    author: userId,
    status: 'published',
  });

  // Auto-notify the audience (spec §17 notifications generated automatically).
  const audience = data.audience === 'all' ? ['student', 'faculty', 'alumni'] : [data.audience];
  const recipients = await User.find({ role: { $in: audience }, isActive: true, isApproved: true })
    .select('_id')
    .lean();

  await Promise.all(
    recipients.slice(0, 200).map((recipient) =>
      createNotification({
        recipientId: recipient._id,
        type: 'announcement',
        title: announcement.title,
        body: announcement.body.slice(0, 140),
        data: { url: '/announcements', announcementId: announcement._id },
      }),
    ),
  );

  return announcement;
}

/** Update (author/admin). */
export async function updateAnnouncement({ announcementId, data, userId, role }) {
  const announcement = await Announcement.findById(announcementId);
  if (!announcement) throw notFound('Announcement not found', 'ANNOUNCEMENT_NOT_FOUND');
  if (role !== 'admin' && String(announcement.author) !== String(userId)) {
    throw forbidden('Only the author or an admin can edit this announcement', 'ANNOUNCEMENT_UPDATE_FORBIDDEN');
  }
  Object.assign(announcement, data);
  await announcement.save();
  return announcement;
}

/** Delete (author/admin). */
export async function deleteAnnouncement({ announcementId, userId, role }) {
  const announcement = await Announcement.findById(announcementId);
  if (!announcement) throw notFound('Announcement not found', 'ANNOUNCEMENT_NOT_FOUND');
  if (role !== 'admin' && String(announcement.author) !== String(userId)) {
    throw forbidden('Only the author or an admin can delete this announcement', 'ANNOUNCEMENT_DELETE_FORBIDDEN');
  }
  await Announcement.deleteOne({ _id: announcementId });
}

/** Pin/unpin (author/admin). */
export async function togglePin({ announcementId, userId, role }) {
  const announcement = await Announcement.findById(announcementId);
  if (!announcement) throw notFound('Announcement not found', 'ANNOUNCEMENT_NOT_FOUND');
  if (role !== 'admin' && String(announcement.author) !== String(userId)) {
    throw forbidden('Only the author or an admin can pin announcements', 'ANNOUNCEMENT_UPDATE_FORBIDDEN');
  }
  announcement.pinned = !announcement.pinned;
  await announcement.save();
  return announcement;
}
