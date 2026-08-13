import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { parsePagination } from '../utils/pagination.js';
import {
  addReviewComment,
  applyToScholarship,
  createScholarship,
  getApplicationById,
  getScholarshipById,
  listApplicationsForReview,
  listMyApplications,
  listScholarships,
  reviewApplication,
  updateScholarship,
} from '../services/scholarshipService.js';

export const getScholarships = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const { search, category, status, sort } = req.query;
  const result = await listScholarships({ filters: { search, category, status }, page, limit, sort });
  sendSuccess(res, { message: 'Scholarships', data: result });
});

export const getScholarship = asyncHandler(async (req, res) => {
  const result = await getScholarshipById({ scholarshipId: req.params.id, userId: req.user._id });
  sendSuccess(res, { message: 'Scholarship details', data: result });
});

export const create = asyncHandler(async (req, res) => {
  const scholarship = await createScholarship({ data: req.body, userId: req.user._id, role: req.user.role, req });
  sendSuccess(res, { status: 201, message: 'Scholarship campaign created', data: { scholarship } });
});

export const update = asyncHandler(async (req, res) => {
  const scholarship = await updateScholarship({ scholarshipId: req.params.id, data: req.body, userId: req.user._id, role: req.user.role, req });
  sendSuccess(res, { message: 'Scholarship updated', data: { scholarship } });
});

export const apply = asyncHandler(async (req, res) => {
  const application = await applyToScholarship({
    data: { ...req.body, scholarshipId: req.params.id },
    userId: req.user._id,
    req,
  });
  sendSuccess(res, { status: 201, message: 'Application submitted', data: { application } });
});

export const getMyApplications = asyncHandler(async (req, res) => {
  const items = await listMyApplications({ userId: req.user._id });
  sendSuccess(res, { message: 'My applications', data: { items } });
});

export const getApplicationsForReview = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = await listApplicationsForReview({ userId: req.user._id, role: req.user.role, status: req.query.status, page, limit });
  sendSuccess(res, { message: 'Applications', data: result });
});

export const getApplication = asyncHandler(async (req, res) => {
  const application = await getApplicationById({ applicationId: req.params.id, userId: req.user._id, role: req.user.role });
  sendSuccess(res, { message: 'Application details', data: { application } });
});

export const review = asyncHandler(async (req, res) => {
  const application = await reviewApplication({ applicationId: req.params.id, userId: req.user._id, role: req.user.role, data: req.body, req });
  sendSuccess(res, { message: 'Application updated', data: { application } });
});

export const comment = asyncHandler(async (req, res) => {
  const application = await addReviewComment({ applicationId: req.params.id, userId: req.user._id, role: req.user.role, text: req.body.text });
  sendSuccess(res, { message: 'Comment added', data: { application } });
});
