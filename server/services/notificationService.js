import Notification from '../models/notification.js';
import User from '../models/user.js';
import { NOTIFICATION_TYPES } from '../config/constants.js';
import { getIO } from '../sockets/index.js';

/**
 * Create an in-app notification and push it to the recipient in real time
 * (socket push is a no-op until the user is connected). Used by every module.
 *
 * @param {Object} params
 * @param {string} params.recipientId
 * @param {string} params.type — one of NOTIFICATION_TYPES
 * @param {string} params.title
 * @param {string} [params.body]
 * @param {Object} [params.data]
 */
export async function createNotification({ recipientId, type, title, body = '', data = null }) {
  if (!NOTIFICATION_TYPES.includes(type)) {
    console.warn(`[notifications] unknown type "${type}" — skipping`);
    return null;
  }

  const notification = await Notification.create({ recipient: recipientId, type, title, body, data });

  // Real-time push (no-op when socket layer is not connected).
  const io = getIO();
  if (io) {
    io.to(`user:${recipientId}`).emit('notification:new', {
      notification: {
        _id: notification._id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        isRead: false,
        createdAt: notification.createdAt,
      },
    });
  }

  return notification;
}

/** Notify every admin (used for pending registrations, reports, etc.). */
export async function notifyAdmins({ type, title, body = '', data = null }) {
  const admins = await User.find({ role: 'admin', isActive: true }).select('_id').lean();
  await Promise.all(
    admins.map((admin) => createNotification({ recipientId: admin._id, type, title, body, data })),
  );
  return admins.length;
}
