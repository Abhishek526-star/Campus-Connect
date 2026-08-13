import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';
import { POST_TYPES } from '../config/constants.js';
import {
  commentHandler,
  commentsHandler,
  createHandler,
  deleteHandler,
  getHandler,
  likeHandler,
  listHandler,
  moderateHandler,
  removeCommentHandler,
  reportHandler,
  saveHandler,
  shareHandler,
  unlikeHandler,
  unsaveHandler,
  updateHandler,
} from '../controllers/postController.js';

const router = Router();

const attachment = z
  .object({
    url: z.string().refine((v) => v.startsWith('http') || v.startsWith('/uploads/'), 'Attachment url is invalid'),
    publicId: z.string().optional().nullable(),
    name: z.string().max(255).optional(),
    mimeType: z.string().max(120).optional(),
    size: z.number().max(25 * 1024 * 1024).optional(),
  })
  .optional();

const postBody = z.object({
  type: z.enum(POST_TYPES).optional(),
  content: z.string().trim().min(2, 'Post content is too short').max(5000),
  images: z.array(attachment).max(5).optional(),
  documents: z.array(attachment).max(5).optional(),
  links: z.array(z.string().trim().max(500)).max(5).optional(),
  tags: z.array(z.string().trim().min(1).max(60)).max(10).optional(),
});

const postUpdate = z.object({
  type: z.enum(POST_TYPES).optional(),
  content: z.string().trim().min(2, 'Post content is too short').max(5000).optional(),
  images: z.array(attachment).max(5).optional(),
  documents: z.array(attachment).max(5).optional(),
  links: z.array(z.string().trim().max(500)).max(5).optional(),
  tags: z.array(z.string().trim().min(1).max(60)).max(10).optional(),
});

router.get('/', requireAuth, listHandler);
router.get('/:id', requireAuth, getHandler);
router.post('/', requireAuth, validate(postBody), createHandler);
router.put('/:id', requireAuth, validate(postUpdate), updateHandler);
router.delete('/:id', requireAuth, deleteHandler);

router.post('/:id/like', requireAuth, likeHandler);
router.delete('/:id/like', requireAuth, unlikeHandler);
router.get('/:id/comments', requireAuth, commentsHandler);
router.post(
  '/:id/comments',
  requireAuth,
  validate(z.object({ content: z.string().trim().min(1).max(2000), parentId: z.string().min(5).optional().nullable() })),
  commentHandler,
);
router.delete('/comments/:id', requireAuth, removeCommentHandler);
router.post('/:id/save', requireAuth, saveHandler);
router.delete('/:id/save', requireAuth, unsaveHandler);
router.post('/:id/share', requireAuth, shareHandler);
router.post(
  '/:id/report',
  requireAuth,
  validate(z.object({ reason: z.string().trim().min(3).max(300), details: z.string().trim().max(1000).optional().or(z.literal('')) })),
  reportHandler,
);
router.put(
  '/:id/moderate',
  requireAuth,
  requireAdmin,
  validate(z.object({ status: z.enum(['published', 'removed']) })),
  moderateHandler,
);

export default router;
