import mongoose from 'mongoose';
import { MulterError } from 'multer';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

/**
 * Centralized error handler — serializes every error to the spec §33 envelope:
 * { success: false, message, error }
 */
export function errorHandler(err, _req, res, _next) {
  let status = 500;
  let message = 'Something went wrong';
  let code = 'INTERNAL_ERROR';
  let details;

  if (err instanceof ApiError) {
    status = err.statusCode;
    message = err.message;
    code = err.code;
    details = err.details;
  } else if (err instanceof SyntaxError && err.status === 400) {
    status = 400;
    code = 'INVALID_JSON';
    message = 'Malformed JSON in request body';
  } else if (err.statusCode || err.status) {
    // Third-party errors that carry an HTTP status (body-parser, etc.).
    status = err.statusCode ?? err.status;
    message = err.expose ? err.message : 'Request could not be processed';
    code = err.code ?? 'HTTP_ERROR';
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({ path: e.path, message: e.message }));
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    code = 'INVALID_ID';
    message = `Invalid ${err.path}: ${err.value}`;
  } else if (err instanceof MulterError) {
    status = 400;
    code = 'UPLOAD_ERROR';
    message = err.code === 'LIMIT_FILE_SIZE' ? 'File too large' : `Upload failed: ${err.message}`;
  } else if (err.code === 11000) {
    status = 409;
    code = 'DUPLICATE_KEY';
    message = `Duplicate value for: ${Object.keys(err.keyValue ?? {}).join(', ') || 'unique field'}`;
  }

  if (status >= 500) {
    console.error('[error]', err);
  } else if (env.isDevelopment) {
    console.warn(`[error] ${status} ${code}: ${message}`);
  }

  const body = { success: false, message, error: { code } };
  if (details && !env.isProduction) body.error.details = details;

  res.status(status).json(body);
}
