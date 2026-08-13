/**
 * Operational API error with an HTTP status and machine-readable code.
 * Thrown by services/controllers; serialized by middleware/errorHandler.js.
 */
export class ApiError extends Error {
  constructor(statusCode, message, code = 'API_ERROR', details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, ApiError);
  }
}

/** Convenience constructors for the most common cases. */
export const badRequest = (message, code = 'BAD_REQUEST', details) => new ApiError(400, message, code, details);
export const unauthorized = (message = 'Unauthorized', code = 'UNAUTHORIZED') => new ApiError(401, message, code);
export const forbidden = (message = 'Forbidden', code = 'FORBIDDEN') => new ApiError(403, message, code);
export const notFound = (message = 'Not found', code = 'NOT_FOUND') => new ApiError(404, message, code);
export const conflict = (message, code = 'CONFLICT') => new ApiError(409, message, code);
export const tooManyRequests = (message = 'Too many requests', code = 'RATE_LIMITED') =>
  new ApiError(429, message, code);
