import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { parsePagination } from '../utils/pagination.js';
import {
  cancelRegistration,
  createEvent,
  deleteEvent,
  getEventById,
  listEvents,
  listMyEvents,
  listParticipants,
  registerForEvent,
  updateEvent,
} from '../services/eventService.js';

export const getEvents = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const { search, category, department, mode, period, sort } = req.query;
  const result = await listEvents({
    filters: { search, category, department, mode, period },
    page,
    limit,
    sort,
  });
  sendSuccess(res, { message: 'Events', data: result });
});

export const getEvent = asyncHandler(async (req, res) => {
  const result = await getEventById({ eventId: req.params.id, userId: req.user._id });
  sendSuccess(res, { message: 'Event details', data: result });
});

export const getMyEvents = asyncHandler(async (req, res) => {
  const items = await listMyEvents({ userId: req.user._id });
  sendSuccess(res, { message: 'My events', data: { items } });
});

export const create = asyncHandler(async (req, res) => {
  const event = await createEvent({ data: req.body, userId: req.user._id, role: req.user.role, req });
  sendSuccess(res, { status: 201, message: 'Event created', data: { event } });
});

export const update = asyncHandler(async (req, res) => {
  const event = await updateEvent({ eventId: req.params.id, data: req.body, userId: req.user._id, role: req.user.role, req });
  sendSuccess(res, { message: 'Event updated', data: { event } });
});

export const remove = asyncHandler(async (req, res) => {
  await deleteEvent({ eventId: req.params.id, userId: req.user._id, role: req.user.role, req });
  sendSuccess(res, { message: 'Event deleted' });
});

export const register = asyncHandler(async (req, res) => {
  const result = await registerForEvent({ eventId: req.params.id, userId: req.user._id });
  sendSuccess(res, { status: 201, message: 'Registered for the event', data: result });
});

export const cancel = asyncHandler(async (req, res) => {
  const result = await cancelRegistration({ eventId: req.params.id, userId: req.user._id });
  sendSuccess(res, { message: 'Registration cancelled', data: result });
});

export const participants = asyncHandler(async (req, res) => {
  const items = await listParticipants({ eventId: req.params.id, userId: req.user._id, role: req.user.role });
  sendSuccess(res, { message: 'Participants', data: { items } });
});
