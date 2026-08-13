import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { globalSearch } from '../services/searchService.js';

/** GET /api/search?q=…&types=people,events,jobs — aggregated global search. */
export const search = asyncHandler(async (req, res) => {
  const types = typeof req.query.types === 'string' && req.query.types ? req.query.types.split(',') : undefined;
  const result = await globalSearch({
    query: req.query.q,
    viewerId: req.user._id,
    filters: { types },
    limit: Number(req.query.limit) || 6,
  });
  sendSuccess(res, { message: 'Search results', data: result });
});
