import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { parsePagination } from '../utils/pagination.js';
import {
  acceptRequest,
  cancelRequest,
  getDirectory,
  getSuggestions,
  listConnections,
  listOutgoingRequests,
  listRequests,
  rejectRequest,
  removeConnection,
  sendRequest,
} from '../services/connectionService.js';

/** GET /api/people — directory with search/filter/pagination (spec §6). */
export const getDirectoryHandler = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const { role, department, graduationYear, company, industry, location, designation, skills, search, sort } = req.query;

  const result = await getDirectory({
    viewerId: req.user._id,
    filters: {
      role,
      department,
      graduationYear,
      company,
      industry,
      location,
      designation,
      skills: typeof skills === 'string' && skills ? skills.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      search,
    },
    page,
    limit,
    sort,
  });

  sendSuccess(res, { message: 'People directory', data: result });
});

export const getConnections = asyncHandler(async (req, res) => {
  const items = await listConnections({ userId: req.user._id, status: req.query.status ?? 'accepted' });
  sendSuccess(res, { message: 'Connections', data: { items } });
});

export const getRequests = asyncHandler(async (req, res) => {
  const items = await listRequests({ userId: req.user._id });
  sendSuccess(res, { message: 'Connection requests', data: { items } });
});

export const getOutgoingRequests = asyncHandler(async (req, res) => {
  const items = await listOutgoingRequests({ userId: req.user._id });
  sendSuccess(res, { message: 'Sent requests', data: { items } });
});

export const getSuggestionsHandler = asyncHandler(async (req, res) => {
  const items = await getSuggestions({ userId: req.user._id, limit: Number(req.query.limit) || 12 });
  sendSuccess(res, { message: 'Suggestions', data: { items } });
});

export const send = asyncHandler(async (req, res) => {
  const connection = await sendRequest({ requesterId: req.user._id, recipientId: req.body.recipientId, req });
  sendSuccess(res, { status: 201, message: 'Connection request sent', data: { connection } });
});

export const accept = asyncHandler(async (req, res) => {
  const connection = await acceptRequest({ connectionId: req.params.id, userId: req.user._id, req });
  sendSuccess(res, { message: 'Connection accepted', data: { connection } });
});

export const reject = asyncHandler(async (req, res) => {
  const connection = await rejectRequest({ connectionId: req.params.id, userId: req.user._id, req });
  sendSuccess(res, { message: 'Connection request rejected', data: { connection } });
});

export const cancel = asyncHandler(async (req, res) => {
  await cancelRequest({ connectionId: req.params.id, userId: req.user._id, req });
  sendSuccess(res, { message: 'Connection request cancelled' });
});

export const remove = asyncHandler(async (req, res) => {
  await removeConnection({ connectionId: req.params.id, userId: req.user._id, req });
  sendSuccess(res, { message: 'Connection removed' });
});
