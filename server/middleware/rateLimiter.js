import rateLimit from 'express-rate-limit';

const standardHeaders = true;
const legacyHeaders = false;

/** Strict limiter for auth endpoints (brute-force protection). */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders,
  legacyHeaders,
  message: {
    success: false,
    message: 'Too many attempts from this IP. Please try again later.',
    error: { code: 'RATE_LIMITED' },
  },
});

/** Standard API limiter. */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders,
  legacyHeaders,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.',
    error: { code: 'RATE_LIMITED' },
  },
});

/** Upload limiter — prevents abuse of storage endpoints. */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 60,
  standardHeaders,
  legacyHeaders,
  message: {
    success: false,
    message: 'Upload limit reached for this IP. Please try again later.',
    error: { code: 'RATE_LIMITED' },
  },
});
