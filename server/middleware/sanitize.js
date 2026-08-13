import mongoSanitize from 'express-mongo-sanitize';

/** Strip dangerous HTML/XSS patterns from a string. */
function sanitizeString(value) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+\s*=\s*(["'])[^"']*\1/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}

function sanitizeValue(value) {
  if (typeof value === 'string') return sanitizeString(value);
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === 'object') return sanitizeObject(value);
  return value;
}

function sanitizeObject(obj) {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    out[key] = sanitizeValue(value);
  }
  return out;
}

/**
 * Query injection sanitization (express-mongo-sanitize: strips $ and . from
 * keys) + basic XSS stripping on request body strings (spec §25).
 */
export function sanitize(req, _res, next) {
  // req.body — always writable. Skip Buffers (Razorpay webhook raw body) —
  // mongo-sanitize would mangle them into plain objects.
  if (!Buffer.isBuffer(req.body)) {
    req.body = mongoSanitize.sanitize(req.body);
    if (req.body && typeof req.body === 'object') req.body = sanitizeObject(req.body);
  }

  // req.params — writable.
  req.params = mongoSanitize.sanitize(req.params);

  // Express 5 exposes req.query as a getter-only property; replace it with a
  // writable data property holding the sanitized query.
  const sanitizedQuery = mongoSanitize.sanitize(req.query);
  try {
    req.query = sanitizedQuery;
  } catch {
    Object.defineProperty(req, 'query', {
      value: sanitizedQuery,
      configurable: true,
      writable: true,
      enumerable: true,
    });
  }

  next();
}
