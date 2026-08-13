import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { parsePagination } from '../utils/pagination.js';
import {
  clearAll,
  listNotifications,
  markAllRead,
  markRead,
  removeNotification,
  unreadCount,
} from '../services/notificationServiceQueries.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = await listNotifications({
    userId: req.user._id,
    page,
    limit,
    type: req.query.type,
    isRead: req.query.isRead,
  });
  sendSuccess(res, { message: 'Notifications', data: result });
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await unreadCount({ userId: req.user._id });
  sendSuccess(res, { message: 'Unread count', data: { count } });
});

export const markOneRead = asyncHandler(async (req, res) => {
  const notification = await markRead({ userId: req.user._id, notificationId: req.params.id });
  sendSuccess(res, { message: 'Notification marked as read', data: { notification } });
});

export const markAll = asyncHandler(async (req, res) => {
  await markAllRead({ userId: req.user._id });
  sendSuccess(res, { message: 'All notifications marked as read' });
});

export const deleteOne = asyncHandler(async (req, res) => {
  await removeNotification({ userId: req.user._id, notificationId: req.params.id });
  sendSuccess(res, { message: 'Notification deleted' });
});

export const deleteAll = asyncHandler(async (req, res) => {
  await clearAll({ userId: req.user._id });
  sendSuccess(res, { message: 'All notifications cleared' });
});
