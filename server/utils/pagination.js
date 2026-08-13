import { PAGINATION } from '../config/constants.js';

/**
 * Parse and normalize ?page & ?limit query params (server-side pagination).
 */
export function parsePagination(query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    PAGINATION.maxLimit,
    Math.max(1, Number.parseInt(query.limit, 10) || PAGINATION.defaultLimit),
  );
  return { page, limit, skip: (page - 1) * limit };
}

/** Build the pagination meta object returned alongside lists. */
export function paginationMeta(total, page, limit) {
  return {
    total,
    page,
    limit,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}

/**
 * Parse a simple `sort` query param ("field" or "-field") into a mongoose sort object.
 * @param {string} sort
 * @param {Object} allowed — map of allowed field -> sort direction default
 */
export function parseSort(sort = '', allowed = {}) {
  if (!sort) return allowed;
  const dir = sort.startsWith('-') ? -1 : 1;
  const field = sort.replace(/^-/, '');
  if (!(field in allowed)) return allowed;
  return { [field]: dir, ...allowed };
}
