import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { parsePagination } from '../utils/pagination.js';
import {
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  togglePin,
  updateAnnouncement,
} from '../services/announcementService.js';

export const getAnnouncements = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = await listAnnouncements({ userId: req.user._id, page, limit });
  sendSuccess(res, { message: 'Announcements', data: result });
});

export const create = asyncHandler(async (req, res) => {
  const announcement = await createAnnouncement({ data: req.body, userId: req.user._id, role: req.user.role });
  sendSuccess(res, { status: 201, message: 'Announcement published — notifications sent', data: { announcement } });
});

export const update = asyncHandler(async (req, res) => {
  const announcement = await updateAnnouncement({ announcementId: req.params.id, data: req.body, userId: req.user._id, role: req.user.role });
  sendSuccess(res, { message: 'Announcement updated', data: { announcement } });
});

export const remove = asyncHandler(async (req, res) => {
  await deleteAnnouncement({ announcementId: req.params.id, userId: req.user._id, role: req.user.role });
  sendSuccess(res, { message: 'Announcement deleted' });
});

export const pin = asyncHandler(async (req, res) => {
  const announcement = await togglePin({ announcementId: req.params.id, userId: req.user._id, role: req.user.role });
  sendSuccess(res, { message: announcement.pinned ? 'Announcement pinned' : 'Announcement unpinned', data: { announcement } });
});
