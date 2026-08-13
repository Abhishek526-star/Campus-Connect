import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';
import {
  block,
  deleteMessage,
  getConversationSearch,
  getConversations,
  getDirect,
  getMessages,
  readMessages,
  report,
  sendMessage,
  unblock,
} from '../controllers/chatController.js';

const router = Router();

const directSchema = z.object({ userId: z.string().min(5, 'User id is required') });
const messageSchema = z.object({
  conversationId: z.string().min(5, 'Conversation id is required'),
  content: z.string().trim().max(5000).optional().or(z.literal('')),
  kind: z.enum(['text', 'image', 'file']).optional(),
  attachment: z
    .object({
      // Absolute URLs (Cloudinary) or relative /uploads/ paths (local dev fallback).
      url: z
        .string()
        .refine((v) => v.startsWith('http') || v.startsWith('/uploads/'), 'Attachment url is invalid'),
      publicId: z.string().optional().nullable(),
      name: z.string().max(255).optional(),
      mimeType: z.string().max(120).optional(),
      size: z.number().max(25 * 1024 * 1024).optional(),
    })
    .optional()
    .nullable(),
});

// Conversations (spec §23)
router.get('/conversations', requireAuth, getConversations);
router.get('/conversations/search', requireAuth, getConversationSearch);
router.post('/conversations/direct', requireAuth, validate(directSchema), getDirect);

// Messages (spec §23)
router.get('/messages/:conversationId', requireAuth, getMessages);
router.post('/messages', requireAuth, validate(messageSchema), sendMessage);
router.patch('/messages/:conversationId/read', requireAuth, readMessages);
router.delete('/messages/:id', requireAuth, deleteMessage);

// Safety (spec §7)
router.post('/conversations/block', requireAuth, validate(directSchema), block);
router.delete('/conversations/block', requireAuth, validate(directSchema), unblock);
router.post('/conversations/report', requireAuth, validate(z.object({ userId: z.string().min(5), reason: z.string().trim().min(3, 'Please provide a reason').max(300) }).extend({ details: z.string().trim().max(1000).optional() })), report);

export default router;
