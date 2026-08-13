import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { parsePagination } from '../utils/pagination.js';
import {
  addComment,
  createPost,
  deleteComment,
  deletePost,
  getPostById,
  likePost,
  listComments,
  listPosts,
  moderatePost,
  reportPost,
  savePost,
  sharePost,
  unlikePost,
  unsavePost,
  updatePost,
} from '../services/postService.js';

export const listHandler = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const { type, authorId, search, sort } = req.query;
  const result = await listPosts({
    viewerId: req.user._id,
    filters: { type, authorId, search, sort },
    page,
    limit,
  });
  sendSuccess(res, { message: 'Posts', data: result });
});

export const getHandler = asyncHandler(async (req, res) => {
  const result = await getPostById({ postId: req.params.id, viewerId: req.user._id });
  sendSuccess(res, { message: 'Post details', data: result });
});

export const createHandler = asyncHandler(async (req, res) => {
  const post = await createPost({ data: req.body, userId: req.user._id, req });
  sendSuccess(res, { status: 201, message: 'Post published', data: { post } });
});

export const updateHandler = asyncHandler(async (req, res) => {
  const post = await updatePost({ postId: req.params.id, data: req.body, userId: req.user._id, role: req.user.role, req });
  sendSuccess(res, { message: 'Post updated', data: { post } });
});

export const deleteHandler = asyncHandler(async (req, res) => {
  await deletePost({ postId: req.params.id, userId: req.user._id, role: req.user.role, req });
  sendSuccess(res, { message: 'Post deleted' });
});

export const likeHandler = asyncHandler(async (req, res) => {
  const result = await likePost({ postId: req.params.id, userId: req.user._id });
  sendSuccess(res, { message: 'Liked', data: result });
});

export const unlikeHandler = asyncHandler(async (req, res) => {
  const result = await unlikePost({ postId: req.params.id, userId: req.user._id });
  sendSuccess(res, { message: 'Unliked', data: result });
});

export const commentsHandler = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = await listComments({ postId: req.params.id, page, limit });
  sendSuccess(res, { message: 'Comments', data: result });
});

export const commentHandler = asyncHandler(async (req, res) => {
  const comment = await addComment({
    postId: req.params.id,
    userId: req.user._id,
    content: req.body.content,
    parentId: req.body.parentId,
  });
  sendSuccess(res, { status: 201, message: 'Comment added', data: { comment } });
});

export const removeCommentHandler = asyncHandler(async (req, res) => {
  await deleteComment({ commentId: req.params.id, userId: req.user._id, role: req.user.role, _req: req });
  sendSuccess(res, { message: 'Comment deleted' });
});

export const saveHandler = asyncHandler(async (req, res) => {
  await savePost({ postId: req.params.id, userId: req.user._id });
  sendSuccess(res, { message: 'Post saved' });
});

export const unsaveHandler = asyncHandler(async (req, res) => {
  await unsavePost({ postId: req.params.id, userId: req.user._id });
  sendSuccess(res, { message: 'Post unsaved' });
});

export const shareHandler = asyncHandler(async (req, res) => {
  const result = await sharePost({ postId: req.params.id });
  sendSuccess(res, { message: 'Post shared', data: result });
});

export const reportHandler = asyncHandler(async (req, res) => {
  await reportPost({ postId: req.params.id, userId: req.user._id, reason: req.body.reason, details: req.body.details });
  sendSuccess(res, { status: 201, message: 'Report submitted. Our moderators will review it.' });
});

export const moderateHandler = asyncHandler(async (req, res) => {
  const post = await moderatePost({ postId: req.params.id, status: req.body.status, userId: req.user._id, role: req.user.role, req });
  sendSuccess(res, { message: `Post ${req.body.status}`, data: { post } });
});
