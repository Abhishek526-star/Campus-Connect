/**
 * Wrap an async route handler so thrown errors reach the error middleware.
 * (Express 5 also forwards rejected promises automatically; this wrapper
 * keeps handlers explicit and testable.)
 */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
