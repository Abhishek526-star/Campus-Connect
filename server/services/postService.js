import Post from '../models/post.js';
import Comment from '../models/comment.js';
import Like from '../models/like.js';
import SavedItem from '../models/savedItem.js';
import Report from '../models/report.js';
import { conflict, forbidden, notFound } from '../utils/ApiError.js';
import { paginationMeta } from '../utils/pagination.js';
import { createNotification } from './notificationService.js';
import { awardReputation } from './certificateService.js';
import { logAudit } from '../utils/audit.js';

const AUTHOR_POPULATE = { path: 'author', select: 'name avatar role badges reputationScore' };

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Community feed (spec §16): posts with text/images/documents/links/tags,
 * likes, comments (replies), shares, saves, reports; admin moderation.
 */
export async function listPosts({ viewerId, filters = {}, page, limit }) {
  const query = { status: 'published' };
  if (filters.type && filters.type !== 'all') query.type = filters.type;
  if (filters.authorId) query.author = filters.authorId;
  if (filters.search) query.content = { $regex: escapeRegExp(filters.search), $options: 'i' };

  const sortOptions = filters.sort === 'top' ? { 'counts.likes': -1, createdAt: -1 } : { createdAt: -1 };

  const [items, total] = await Promise.all([
    Post.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('author type content images documents links tags counts isPinned createdAt')
      .populate(AUTHOR_POPULATE)
      .lean(),
    Post.countDocuments(query),
  ]);

  // Viewer state: liked/saved + comment count + recent comments.
  const postIds = items.map((post) => post._id);
  const [likes, saved, comments] = await Promise.all([
    viewerId ? Like.find({ user: viewerId, targetType: 'post', targetId: { $in: postIds } }).select('targetId').lean() : [],
    viewerId ? SavedItem.find({ user: viewerId, itemType: 'post', itemId: { $in: postIds } }).select('itemId').lean() : [],
    Comment.aggregate([
      { $match: { post: { $in: postIds }, status: 'published' } },
      { $group: { _id: '$post', count: { $sum: 1 } } },
    ]),
  ]);

  const likedSet = new Set(likes.map((l) => String(l.targetId)));
  const savedSet = new Set(saved.map((s) => String(s.itemId)));
  const commentCounts = new Map(comments.map((c) => [String(c._id), c.count]));

  return {
    items: items.map((post) => ({
      ...post,
      isLiked: likedSet.has(String(post._id)),
      isSaved: savedSet.has(String(post._id)),
      commentCount: commentCounts.get(String(post._id)) ?? 0,
    })),
    meta: paginationMeta(total, page, limit),
  };
}

/** Create a post (all roles can post — spec §16). */
export async function createPost({ data, userId, req }) {
  const post = await Post.create({
    author: userId,
    type: data.type ?? 'knowledge',
    content: data.content,
    images: data.images ?? [],
    documents: data.documents ?? [],
    links: data.links ?? [],
    tags: data.tags ?? [],
  });

  await awardReputation({ userId, rule: 'post_created' });
  await logAudit({
    action: 'post_moderate',
    actorId: userId,
    targetType: 'post',
    targetId: post._id,
    details: { action: 'create', type: post.type },
    req,
  });
  return post;
}

export async function getPostById({ postId, viewerId }) {
  const post = await Post.findById(postId).populate(AUTHOR_POPULATE).lean();
  if (!post) throw notFound('Post not found', 'POST_NOT_FOUND');
  if (post.status !== 'published') throw notFound('Post not found', 'POST_NOT_FOUND');

  const [isLiked, isSaved, commentCount] = await Promise.all([
    viewerId ? Like.exists({ user: viewerId, targetType: 'post', targetId: postId }) : false,
    viewerId ? SavedItem.exists({ user: viewerId, itemType: 'post', itemId: postId }) : false,
    Comment.countDocuments({ post: postId, status: 'published' }),
  ]);

  return { post: { ...post, isLiked: Boolean(isLiked), isSaved: Boolean(isSaved), commentCount } };
}

/** Update own post. */
export async function updatePost({ postId, data, userId, role, _req }) {
  const post = await Post.findById(postId);
  if (!post) throw notFound('Post not found', 'POST_NOT_FOUND');
  if (role !== 'admin' && String(post.author) !== String(userId)) {
    throw forbidden('Only the author can edit this post', 'POST_UPDATE_FORBIDDEN');
  }
  Object.assign(post, data);
  await post.save();
  return post;
}

/** Delete own post (or admin). */
export async function deletePost({ postId, userId, role, req }) {
  const post = await Post.findById(postId);
  if (!post) throw notFound('Post not found', 'POST_NOT_FOUND');
  if (role !== 'admin' && String(post.author) !== String(userId)) {
    throw forbidden('Only the author can delete this post', 'POST_DELETE_FORBIDDEN');
  }
  await Comment.deleteMany({ post: postId });
  await Like.deleteMany({ targetType: 'post', targetId: postId });
  await SavedItem.deleteMany({ itemType: 'post', itemId: postId });
  await Post.deleteOne({ _id: postId });
  await logAudit({
    action: 'post_moderate',
    actorId: userId,
    targetType: 'post',
    targetId: postId,
    details: { action: 'delete' },
    req,
  });
}

/** Like/unlike with counter sync. */
export async function likePost({ postId, userId }) {
  const post = await Post.findById(postId).select('_id author counts');
  if (!post) throw notFound('Post not found', 'POST_NOT_FOUND');

  const existing = await Like.findOne({ user: userId, targetType: 'post', targetId: postId });
  if (existing) throw conflict('Already liked', 'ALREADY_LIKED');

  await Like.create({ user: userId, targetType: 'post', targetId: postId, targetModel: 'Post' });
  await Post.updateOne({ _id: postId }, { $inc: { 'counts.likes': 1 } });

  if (String(post.author) !== String(userId)) {
    const liker = await (await import('../models/user.js')).default.findById(userId).select('name');
    await createNotification({
      recipientId: post.author,
      type: 'post_status',
      title: 'New like',
      body: `${liker?.name ?? 'Someone'} liked your post`,
      data: { url: `/community/${postId}`, postId },
    });
  }
  return { liked: true, likes: (post.counts?.likes ?? 0) + 1 };
}

export async function unlikePost({ postId, userId }) {
  const result = await Like.deleteOne({ user: userId, targetType: 'post', targetId: postId });
  if (result.deletedCount === 0) throw notFound('Like not found', 'LIKE_NOT_FOUND');
  await Post.updateOne({ _id: postId, 'counts.likes': { $gt: 0 } }, { $inc: { 'counts.likes': -1 } });
  const post = await Post.findById(postId).select('counts').lean();
  return { liked: false, likes: Math.max(0, (post?.counts?.likes ?? 1) - 1) };
}

/** Comments with replies. */
export async function listComments({ postId, page, limit }) {
  const query = { post: postId, status: 'published' };
  const [items, total] = await Promise.all([
    Comment.find(query)
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({ path: 'author', select: 'name avatar role' })
      .lean(),
    Comment.countDocuments(query),
  ]);
  return { items, meta: paginationMeta(total, page, limit) };
}

export async function addComment({ postId, userId, content, parentId = null }) {
  const post = await Post.findById(postId).select('_id author');
  if (!post) throw notFound('Post not found', 'POST_NOT_FOUND');
  if (parentId) {
    const parent = await Comment.findOne({ _id: parentId, post: postId });
    if (!parent) throw notFound('Comment not found', 'COMMENT_NOT_FOUND');
  }
  const comment = await Comment.create({ post: postId, author: userId, content, parent: parentId ?? null });
  await Post.updateOne({ _id: postId }, { $inc: { 'counts.comments': 1 } });

  if (String(post.author) !== String(userId)) {
    const commenter = await (await import('../models/user.js')).default.findById(userId).select('name');
    await createNotification({
      recipientId: post.author,
      type: 'post_status',
      title: 'New comment',
      body: `${commenter?.name ?? 'Someone'} commented: ${content.slice(0, 80)}`,
      data: { url: `/community/${postId}`, postId },
    });
  }
  return comment;
}

export async function deleteComment({ commentId, userId, role, _req }) {
  const comment = await Comment.findById(commentId);
  if (!comment) throw notFound('Comment not found', 'COMMENT_NOT_FOUND');
  if (role !== 'admin' && String(comment.author) !== String(userId)) {
    throw forbidden('Only the author can delete this comment', 'COMMENT_DELETE_FORBIDDEN');
  }
  await Comment.deleteMany({ parent: commentId });
  await Comment.deleteOne({ _id: commentId });
  await Post.updateOne({ _id: comment.post, 'counts.comments': { $gt: 0 } }, { $inc: { 'counts.comments': -1 } });
}

/** Save a post. */
export async function savePost({ postId, userId }) {
  const post = await Post.findById(postId).select('_id');
  if (!post) throw notFound('Post not found', 'POST_NOT_FOUND');
  const saved = await SavedItem.findOneAndUpdate(
    { user: userId, itemType: 'post', itemId: postId },
    { $setOnInsert: { user: userId, itemType: 'post', itemId: postId } },
    { upsert: true, new: true },
  );
  await Post.updateOne({ _id: postId }, { $inc: { 'counts.saves': 1 } }).catch(() => {});
  return saved;
}

export async function unsavePost({ postId, userId }) {
  await SavedItem.deleteOne({ user: userId, itemType: 'post', itemId: postId });
  await Post.updateOne({ _id: postId, 'counts.saves': { $gt: 0 } }, { $inc: { 'counts.saves': -1 } }).catch(() => {});
}

/** Share — increments the counter and returns the URL. */
export async function sharePost({ postId }) {
  const post = await Post.findById(postId).select('_id counts');
  if (!post) throw notFound('Post not found', 'POST_NOT_FOUND');
  await Post.updateOne({ _id: postId }, { $inc: { 'counts.shares': 1 } });
  return { url: `/community/${postId}` };
}

/** Report a post. */
export async function reportPost({ postId, userId, reason, details }) {
  const post = await Post.findById(postId).select('_id');
  if (!post) throw notFound('Post not found', 'POST_NOT_FOUND');
  const existing = await Report.findOne({ reporter: userId, targetType: 'post', targetId: postId, status: 'pending' });
  if (existing) throw conflict('You have already reported this post', 'ALREADY_REPORTED');
  await Report.create({ reporter: userId, targetType: 'post', targetId: postId, reason, details });
}

/** Admin moderation. */
export async function moderatePost({ postId, status, userId, role, req }) {
  if (role !== 'admin') throw forbidden('Only administrators can moderate posts', 'MODERATE_FORBIDDEN');
  const post = await Post.findById(postId);
  if (!post) throw notFound('Post not found', 'POST_NOT_FOUND');
  post.status = status;
  await post.save();
  await createNotification({
    recipientId: post.author,
    type: 'post_status',
    title: `Post ${status}`,
    body: `"${post.content.slice(0, 80)}…" was ${status} by a moderator`,
    data: { url: '/community', postId },
  });
  await logAudit({
    action: 'post_moderate',
    actorId: userId,
    targetType: 'post',
    targetId: postId,
    details: { action: 'moderate', status },
    req,
  });
  return post;
}
