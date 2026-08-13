import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { parsePagination } from '../utils/pagination.js';
import {
  createMeeting,
  deleteMeeting,
  getMeetingById,
  listMeetings,
  organizerSetStatus,
  respondToMeeting,
  sendReminder,
  updateMeeting,
} from '../services/meetingService.js';

export const getMeetings = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = await listMeetings({ userId: req.user._id, status: req.query.status, page, limit });
  sendSuccess(res, { message: 'Meetings', data: result });
});

export const getMeeting = asyncHandler(async (req, res) => {
  const result = await getMeetingById({ meetingId: req.params.id, userId: req.user._id });
  sendSuccess(res, { message: 'Meeting details', data: result });
});

export const create = asyncHandler(async (req, res) => {
  const result = await createMeeting({ data: req.body, userId: req.user._id, req });
  sendSuccess(res, { status: 201, message: 'Meeting scheduled — invitations sent', data: result });
});

export const update = asyncHandler(async (req, res) => {
  const meeting = await updateMeeting({ meetingId: req.params.id, data: req.body, userId: req.user._id, role: req.user.role, req });
  sendSuccess(res, { message: 'Meeting updated', data: { meeting } });
});

export const respond = asyncHandler(async (req, res) => {
  const participation = await respondToMeeting({ meetingId: req.params.id, userId: req.user._id, status: req.body.status, req });
  sendSuccess(res, { message: `Invitation ${req.body.status}`, data: { participation } });
});

export const setStatus = asyncHandler(async (req, res) => {
  const meeting = await organizerSetStatus({ meetingId: req.params.id, userId: req.user._id, role: req.user.role, status: req.body.status, req });
  sendSuccess(res, { message: `Meeting marked ${req.body.status}`, data: { meeting } });
});

export const remove = asyncHandler(async (req, res) => {
  await deleteMeeting({ meetingId: req.params.id, userId: req.user._id, role: req.user.role, req });
  sendSuccess(res, { message: 'Meeting deleted' });
});

export const remind = asyncHandler(async (req, res) => {
  const result = await sendReminder({ meetingId: req.params.id, userId: req.user._id, role: req.user.role, req });
  sendSuccess(res, { message: 'Reminders sent', data: result });
});
