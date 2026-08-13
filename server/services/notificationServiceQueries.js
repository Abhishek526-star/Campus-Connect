import Notification from '../models/notification.js';
import { NOTIFICATION_TYPES } from '../config/constants.js';
import { paginationMeta } from '../utils/pagination.js';
import { notFound } from '../utils/ApiError.js';

/** List the current user's notifications (newest first) with optional filters. */
export async function listNotifications({ userId, page, limit, type, isRead }) {
  const query = { recipient: userId };
  if (type && NOTIFICATION_TYPES.includes(type)) query.type = type;
  if (isRead === 'true' || isRead === true) query.isRead = true;
  else if (isRead === 'false' || isRead === false) query.isRead = false;

  const [items, total] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Notification.countDocuments(query),
  ]);
  return { items, meta: paginationMeta(total, page, limit) };
}

/** Count unread notifications for the badge. */
export async function unreadCount({ userId }) {
  return Notification.countDocuments({ recipient: userId, isRead: false });
}

/** Mark a single notification as read (owner only). */
export async function markRead({ userId, notificationId }) {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { $set: { isRead: true, readAt: new Date() } },
    { new: true },
  );
  if (!notification) throw notFound('Notification not found', 'NOTIFICATION_NOT_FOUND');
  return notification;
}

/** Mark all notifications as read. */
export async function markAllRead({ userId }) {
  await Notification.updateMany({ recipient: userId, isRead: false }, { $set: { isRead: true, readAt: new Date() } });
}

/** Delete a single notification (owner only). */
export async function removeNotification({ userId, notificationId }) {
  const result = await Notification.deleteOne({ _id: notificationId, recipient: userId });
  if (result.deletedCount === 0) throw notFound('Notification not found', 'NOTIFICATION_NOT_FOUND');
}

/** Clear all notifications. */
export async function clearAll({ userId }) {
  await Notification.deleteMany({ recipient: userId });
}
