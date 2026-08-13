import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { uploadFile } from '../services/uploadService.js';

/**
 * POST /api/upload — single file, `use` in body/query picks the whitelist.
 * Returns attachment metadata for use by domain mutations.
 */
export const uploadFileHandler = asyncHandler(async (req, res) => {
  const use = req.query?.use ?? req.body?.use;
  const file = req.file;

  const { url, publicId } = await uploadFile({
    buffer: file.buffer,
    originalName: file.originalname,
    mimetype: file.mimetype,
    use,
    userId: req.user._id,
  });

  sendSuccess(res, {
    status: 201,
    message: 'File uploaded successfully',
    data: {
      attachment: {
        url,
        publicId,
        name: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      },
    },
  });
});
