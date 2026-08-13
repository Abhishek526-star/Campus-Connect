import { ZodError } from 'zod';
import { badRequest } from '../utils/ApiError.js';

/**
 * Zod validation middleware.
 * Usage: router.post('/', validate(registerSchema), handler)
 * The validated (coerced) data replaces the request field for downstream code.
 */
export const validate = (schema, source = 'body') => (req, _res, next) => {
  try {
    const parsed = schema.parse(req[source]);
    req[source] = parsed;
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      return next(badRequest('Validation failed', 'VALIDATION_ERROR', details));
    }
    next(error);
  }
};
