import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { parsePagination } from '../utils/pagination.js';
import {
  bookmarkResource,
  createResource,
  deleteResource,
  downloadResource,
  getCategories,
  getResourceById,
  listBookmarkedResources,
  listResources,
  moderateResource,
  rateResource,
  reportResource,
  unbookmarkResource,
  updateResource,
} from '../services/resourceService.js';

export const getResources = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const { search, category, subCategory, subject, semester, sort, includeMine, includePending, status } = req.query;
  const result = await listResources({
    viewerId: req.user._id,
    filters: { search, category, subCategory, subject, semester, includeMine, includePending, status },
    page, limit, sort,
  });
  sendSuccess(res, { message: 'Resources', data: result });
});

export const getResource = asyncHandler(async (req, res) => {
  const result = await getResourceById({ resourceId: req.params.id, userId: req.user._id });
  sendSuccess(res, { message: 'Resource details', data: result });
});

export const create = asyncHandler(async (req, res) => {
  const resource = await createResource({ data: req.body, userId: req.user._id, role: req.user.role, req });
  sendSuccess(res, { status: 201, message: 'Resource uploaded — pending admin approval', data: { resource } });
});

export const update = asyncHandler(async (req, res) => {
  const resource = await updateResource({ resourceId: req.params.id, data: req.body, userId: req.user._id, role: req.user.role, req });
  sendSuccess(res, { message: 'Resource updated', data: { resource } });
});

export const remove = asyncHandler(async (req, res) => {
  await deleteResource({ resourceId: req.params.id, userId: req.user._id, role: req.user.role, req });
  sendSuccess(res, { message: 'Resource deleted' });
});

export const rate = asyncHandler(async (req, res) => {
  const result = await rateResource({ resourceId: req.params.id, userId: req.user._id, rating: req.body.rating });
  sendSuccess(res, { message: 'Rating saved', data: result });
});

export const bookmark = asyncHandler(async (req, res) => {
  await bookmarkResource({ resourceId: req.body.resourceId, userId: req.user._id });
  sendSuccess(res, { message: 'Resource bookmarked' });
});

export const unbookmark = asyncHandler(async (req, res) => {
  await unbookmarkResource({ resourceId: req.body.resourceId, userId: req.user._id });
  sendSuccess(res, { message: 'Bookmark removed' });
});

export const bookmarked = asyncHandler(async (req, res) => {
  const items = await listBookmarkedResources({ userId: req.user._id });
  sendSuccess(res, { message: 'Bookmarked resources', data: { items } });
});

export const download = asyncHandler(async (req, res) => {
  const result = await downloadResource({ resourceId: req.params.id, userId: req.user._id });
  sendSuccess(res, { message: 'Download ready', data: result });
});

export const report = asyncHandler(async (req, res) => {
  await reportResource({ resourceId: req.params.id, userId: req.user._id, reason: req.body.reason, details: req.body.details });
  sendSuccess(res, { status: 201, message: 'Report submitted. Our moderators will review it.' });
});

export const moderate = asyncHandler(async (req, res) => {
  const resource = await moderateResource({ resourceId: req.params.id, status: req.body.status, userId: req.user._id, role: req.user.role, req });
  sendSuccess(res, { message: `Resource ${req.body.status}`, data: { resource } });
});

export const categories = asyncHandler(async (_req, res) => {
  const items = await getCategories();
  sendSuccess(res, { message: 'Resource categories', data: { items } });
});
