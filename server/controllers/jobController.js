import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { parsePagination } from '../utils/pagination.js';
import {
  applyToJob,
  createJob,
  deleteJob,
  getJobById,
  listJobs,
  listSavedJobs,
  moderateJob,
  reportJob,
  saveJob,
  unsaveJob,
  updateJob,
} from '../services/jobService.js';

export const getJobs = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const { search, type, workMode, location, company, skills, experience, sort, includeAll, postedByMe, status } = req.query;
  const result = await listJobs({
    viewerId: req.user._id,
    filters: {
      search, type, workMode, location, company, skills: typeof skills === 'string' && skills ? skills.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      experience, includeAll, postedByMe, status,
    },
    page, limit, sort,
  });
  sendSuccess(res, { message: 'Opportunities', data: result });
});

export const getJob = asyncHandler(async (req, res) => {
  const result = await getJobById({ jobId: req.params.id, userId: req.user._id });
  sendSuccess(res, { message: 'Opportunity details', data: result });
});

export const create = asyncHandler(async (req, res) => {
  const job = await createJob({ data: req.body, userId: req.user._id, role: req.user.role, req });
  sendSuccess(res, { status: 201, message: 'Opportunity posted', data: { job } });
});

export const update = asyncHandler(async (req, res) => {
  const job = await updateJob({ jobId: req.params.id, data: req.body, userId: req.user._id, role: req.user.role, req });
  sendSuccess(res, { message: 'Opportunity updated', data: { job } });
});

export const remove = asyncHandler(async (req, res) => {
  await deleteJob({ jobId: req.params.id, userId: req.user._id, role: req.user.role, req });
  sendSuccess(res, { message: 'Opportunity deleted' });
});

export const save = asyncHandler(async (req, res) => {
  await saveJob({ jobId: req.body.jobId, userId: req.user._id });
  sendSuccess(res, { message: 'Opportunity saved' });
});

export const unsave = asyncHandler(async (req, res) => {
  await unsaveJob({ jobId: req.body.jobId, userId: req.user._id });
  sendSuccess(res, { message: 'Opportunity removed from saved' });
});

export const saved = asyncHandler(async (req, res) => {
  const items = await listSavedJobs({ userId: req.user._id });
  sendSuccess(res, { message: 'Saved opportunities', data: { items } });
});

export const apply = asyncHandler(async (req, res) => {
  const result = await applyToJob({ jobId: req.body.jobId, userId: req.user._id });
  sendSuccess(res, { status: 201, message: result.external ? 'Opening application link' : 'Application submitted', data: result });
});

export const report = asyncHandler(async (req, res) => {
  await reportJob({ jobId: req.body.jobId, userId: req.user._id, reason: req.body.reason, details: req.body.details });
  sendSuccess(res, { status: 201, message: 'Report submitted. Our moderators will review it.' });
});

export const moderate = asyncHandler(async (req, res) => {
  const job = await moderateJob({ jobId: req.params.id, status: req.body.status, userId: req.user._id, role: req.user.role, req });
  sendSuccess(res, { message: `Opportunity ${req.body.status}`, data: { job } });
});
