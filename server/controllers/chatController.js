import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { parsePagination } from '../utils/pagination.js';
import {
  blockUser,
  deleteMessageForSelf,
  getOrCreateDirectConversation,
  listConversations,
  listMessages,
  markMessagesRead,
  persistMessage,
  reportUser,
  searchConversations,
  unblockUser,
} from '../services/chatService.js';
import { getIO } from '../sockets/index.js';

export const getConversations = asyncHandler(async (req, res) => {
  const items = await listConversations(req.user._id);
  sendSuccess(res, { message: 'Conversations', data: { items } });
});

export const getConversationSearch = asyncHandler(async (req, res) => {
  const items = await searchConversations({ userId: req.user._id, query: req.query.q ?? '' });
  sendSuccess(res, { message: 'Conversation search', data: { items } });
});

export const getDirect = asyncHandler(async (req, res) => {
  const conversation = await getOrCreateDirectConversation({ userId: req.user._id, otherId: req.body.userId });
  sendSuccess(res, { status: 201, message: 'Conversation ready', data: { conversation } });
});

export const getMessages = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = await listMessages({ conversationId: req.params.conversationId, userId: req.user._id, page, limit });
  sendSuccess(res, { message: 'Messages', data: result });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { message } = await persistMessage({
    conversationId: req.body.conversationId,
    senderId: req.user._id,
    content: req.body.content ?? '',
    kind: req.body.kind ?? 'text',
    attachment: req.body.attachment ?? null,
  });

  // Broadcast to the conversation room (realtime peers).
  const io = getIO();
  if (io) io.to(`conversation:${req.body.conversationId}`).emit('message:new', { conversationId: req.body.conversationId, message });

  sendSuccess(res, { status: 201, message: 'Message sent', data: { message } });
});

export const readMessages = asyncHandler(async (req, res) => {
  const result = await markMessagesRead({
    conversationId: req.params.conversationId,
    userId: req.user._id,
    messageIds: req.body.messageIds,
  });
  sendSuccess(res, { message: 'Messages marked as read', data: result });
});

export const deleteMessage = asyncHandler(async (req, res) => {
  await deleteMessageForSelf({ messageId: req.params.id, userId: req.user._id, req });
  sendSuccess(res, { message: 'Message deleted for you' });
});

export const block = asyncHandler(async (req, res) => {
  await blockUser({ userId: req.user._id, blockUserId: req.body.userId, req });
  sendSuccess(res, { message: 'User blocked' });
});

export const unblock = asyncHandler(async (req, res) => {
  await unblockUser({ userId: req.user._id, blockUserId: req.body.userId });
  sendSuccess(res, { message: 'User unblocked' });
});

export const report = asyncHandler(async (req, res) => {
  await reportUser({
    userId: req.user._id,
    reportedId: req.body.userId,
    reason: req.body.reason,
    details: req.body.details,
    req,
  });
  sendSuccess(res, { status: 201, message: 'Report submitted. Our moderators will review it.' });
});
