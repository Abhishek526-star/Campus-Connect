import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import {
  getMyProfile,
  getPublicProfile,
  updateAvatar,
  updateBasics,
  updatePrivacy,
  updateRoleProfile,
} from '../services/userService.js';
import { uploadFile } from '../services/uploadService.js';

export const getMe = asyncHandler(async (req, res) => {
  const result = await getMyProfile(req.user._id);
  sendSuccess(res, { message: 'Profile', data: result });
});

export const patchMe = asyncHandler(async (req, res) => {
  const user = await updateBasics(req.user._id, req.body);
  sendSuccess(res, { message: 'Profile updated', data: { user } });
});

export const patchRoleProfile = asyncHandler(async (req, res) => {
  const profile = await updateRoleProfile(req.user._id, req.user.role, req.body);
  sendSuccess(res, { message: 'Profile updated', data: { profile } });
});

export const patchPrivacy = asyncHandler(async (req, res) => {
  const privacy = await updatePrivacy(req.user._id, req.body);
  sendSuccess(res, { message: 'Privacy settings updated', data: { privacy } });
});

export const patchAvatar = asyncHandler(async (req, res) => {
  const file = req.file;
  const { url, publicId } = await uploadFile({
    buffer: file.buffer,
    originalName: file.originalname,
    mimetype: file.mimetype,
    use: 'avatar',
    userId: req.user._id,
  });
  const avatar = await updateAvatar(req.user._id, { url, publicId });
  sendSuccess(res, { message: 'Profile picture updated', data: { avatar } });
});

/** Public profile view — privacy-aware (spec §41). */
export const getById = asyncHandler(async (req, res) => {
  const result = await getPublicProfile(req.params.id, req.user?._id);
  sendSuccess(res, { message: 'Profile', data: result });
});
