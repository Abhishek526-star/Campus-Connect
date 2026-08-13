import multer from 'multer';
import { UPLOAD_USES } from '../config/constants.js';
import { badRequest } from '../utils/ApiError.js';

/**
 * Multer setup: in-memory storage (files go straight to Cloudinary),
 * MIME whitelist per use-case, and per-use size caps.
 * Never trust the file extension — the MIME type is the gate (spec §24).
 *
 * The upload `use` is read from the QUERY STRING (?use=avatar) because
 * req.body is not populated until multer parses the multipart stream;
 * a multipart `use` field is accepted as a fallback.
 */
const memoryStorage = multer.memoryStorage();

function resolveUse(req) {
  const use = req.query?.use ?? req.body?.use;
  if (!use || !UPLOAD_USES[use]) {
    throw badRequest(`Unknown upload use. Allowed: ${Object.keys(UPLOAD_USES).join(', ')}`, 'INVALID_UPLOAD_USE');
  }
  return use;
}

function fileFilter(req, file, cb) {
  try {
    const { mimeTypes, label } = UPLOAD_USES[resolveUse(req)];
    if (!mimeTypes.includes(file.mimetype)) {
      return cb(badRequest(`Unsupported ${label} file type: ${file.mimetype}`, 'UNSUPPORTED_FILE_TYPE'));
    }
    cb(null, true);
  } catch (error) {
    cb(error);
  }
}

const uploader = multer({
  storage: memoryStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // upper bound; per-use caps applied below
  fileFilter,
});

/**
 * Single-file upload middleware with per-use MIME + size validation.
 * Use: singleUpload('file')  →  POST /api/upload?use=avatar
 */
export const singleUpload = (fieldName = 'file') => (req, res, next) => {
  uploader.single(fieldName)(req, res, (err) => {
    try {
      if (err) {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          return next(badRequest('File exceeds the 25 MB upload limit', 'FILE_TOO_LARGE'));
        }
        return next(err);
      }
      if (!req.file) {
        return next(badRequest('No file provided', 'NO_FILE'));
      }
      const { maxSize, label } = UPLOAD_USES[resolveUse(req)];
      if (req.file.size > maxSize) {
        return next(
          badRequest(`${label} exceeds the ${Math.round(maxSize / 1024 / 1024)} MB limit`, 'FILE_TOO_LARGE'),
        );
      }
      next();
    } catch (error) {
      next(error);
    }
  });
};
