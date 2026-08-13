import Conversation from '../models/conversation.js';
import Message from '../models/message.js';
import User from '../models/user.js';
import Block from '../models/block.js';
import Report from '../models/report.js';
import { badRequest, forbidden, notFound } from '../utils/ApiError.js';
import { paginationMeta } from '../utils/pagination.js';
import { isUserOnline } from '../sockets/index.js';
import { logAudit } from '../utils/audit.js';

const POPULATE_PARTICIPANTS = { path: 'participants', select: 'name avatar role badges' };
const POPULATE_LAST = { path: 'lastMessage', select: 'content kind attachment sender createdAt isRead' };

/** Get or create a direct conversation between two users (block-aware). */
export async function getOrCreateDirectConversation({ userId, otherId }) {
  if (String(userId) === String(otherId)) {
    throw badRequest('You cannot message yourself', 'SELF_MESSAGE');
  }
  const other = await User.findById(otherId).select('name isActive isApproved');
  if (!other || !other.isActive || !other.isApproved) {
    throw notFound('User not found', 'USER_NOT_FOUND');
  }
  await assertNotBlocked(userId, otherId);

  let conversation = await Conversation.findOne({
    type: 'direct',
    participants: { $all: [userId, otherId], $size: 2 },
  });
  if (!conversation) {
    conversation = await Conversation.create({ type: 'direct', participants: [userId, otherId] });
  }
  return conversation;
}

/** Block check — a block in either direction prevents messaging. */
export async function assertNotBlocked(userId, otherId) {
  const blocked = await Block.exists({
    $or: [
      { blocker: userId, blocked: otherId },
      { blocker: otherId, blocked: userId },
    ],
  });
  if (blocked) throw forbidden('Messaging is blocked with this user', 'CHAT_BLOCKED');
}

/** List the user's conversations with unread counts and last message. */
export async function listConversations(userId) {
  const conversations = await Conversation.find({ participants: userId })
    .sort({ lastMessageAt: -1 })
    .populate(POPULATE_PARTICIPANTS)
    .populate(POPULATE_LAST)
    .lean();

  const items = await Promise.all(
    conversations.map(async (conversation) => {
      const unreadCount = await Message.countDocuments({
        conversation: conversation._id,
        sender: { $ne: userId },
        readBy: { $nin: [userId] },
        deletedFor: { $nin: [userId] },
      });

      const other = conversation.participants.find(
        (participant) => String(participant._id) !== String(userId),
      ) ?? conversation.participants[0];

      return {
        _id: conversation._id,
        type: conversation.type,
        name: conversation.name || other?.name,
        otherUser: other ?? null,
        lastMessage: conversation.lastMessage ?? null,
        lastMessageAt: conversation.lastMessageAt,
        unreadCount,
      };
    }),
  );

  return items;
}

/** Search the user's conversations by participant name (spec §7 search). */
export async function searchConversations({ userId, query }) {
  const conversations = await Conversation.find({ participants: userId }).select('participants').lean();
  const participantIds = [...new Set(conversations.flatMap((c) => c.participants.map(String)))];

  const matches = await User.find({
    _id: { $in: participantIds },
    name: { $regex: String(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' },
  })
    .select('name avatar role')
    .limit(10)
    .lean();

  return matches;
}

/** Paginated messages for a conversation (member only), excluding deleted-for-me. */
export async function listMessages({ conversationId, userId, page, limit }) {
  await assertMember(conversationId, userId);

  const query = { conversation: conversationId, deletedFor: { $nin: [userId] } };
  const [items, total] = await Promise.all([
    Message.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', 'name avatar role')
      .lean(),
    Message.countDocuments(query),
  ]);

  return { items: items.reverse(), meta: paginationMeta(total, page, limit) };
}

async function assertMember(conversationId, userId) {
  const conversation = await Conversation.findOne({ _id: conversationId, participants: userId }).select('_id');
  if (!conversation) throw notFound('Conversation not found', 'CONVERSATION_NOT_FOUND');
  return conversation;
}

/** Persist a message (used by both the REST fallback and the socket handler). */
export async function persistMessage({ conversationId, senderId, content, kind = 'text', attachment = null }) {
  const conversation = await Conversation.findOne({ _id: conversationId, participants: senderId });
  if (!conversation) throw notFound('Conversation not found', 'CONVERSATION_NOT_FOUND');

  const otherId = conversation.participants.find((id) => String(id) !== String(senderId));
  if (otherId) await assertNotBlocked(senderId, otherId);

  if (!content?.trim() && kind === 'text' && !attachment) {
    throw badRequest('Message cannot be empty', 'EMPTY_MESSAGE');
  }

  const message = await Message.create({
    conversation: conversationId,
    sender: senderId,
    kind,
    content: content?.trim() ?? '',
    attachment,
  });

  await Conversation.updateOne(
    { _id: conversationId },
    { $set: { lastMessage: message._id, lastMessageAt: message.createdAt } },
  );

  return { message: await Message.populate(message, { path: 'sender', select: 'name avatar role' }), otherId };
}

/** Mark messages as read by the user (bulk). */
export async function markMessagesRead({ conversationId, userId, messageIds }) {
  await assertMember(conversationId, userId);
  const filter = { conversation: conversationId, sender: { $ne: userId } };
  if (messageIds?.length) filter._id = { $in: messageIds };

  const result = await Message.updateMany(
    { ...filter, readBy: { $nin: [userId] } },
    { $push: { readBy: userId }, $set: { isRead: true } },
  );
  return { modifiedCount: result.modifiedCount };
}

/** Delete a message for the sender only (spec §7 delete message). */
export async function deleteMessageForSelf({ messageId, userId, req }) {
  const message = await Message.findOne({ _id: messageId, sender: userId });
  if (!message) throw notFound('Message not found', 'MESSAGE_NOT_FOUND');
  if (message.deletedFor.includes(userId)) return;

  message.deletedFor.push(userId);
  await message.save();
  await logAudit({ action: 'chat_block', actorId: userId, targetType: 'message', targetId: messageId, req });
  return message;
}

/** Block a user (adds Block record + blockedUsers list). */
export async function blockUser({ userId, blockUserId, req }) {
  if (String(userId) === String(blockUserId)) throw badRequest('You cannot block yourself', 'SELF_BLOCK');

  await Block.updateOne(
    { blocker: userId, blocked: blockUserId },
    { $setOnInsert: { blocker: userId, blocked: blockUserId } },
    { upsert: true },
  );
  await User.updateOne({ _id: userId }, { $addToSet: { blockedUsers: blockUserId } });

  await logAudit({ action: 'chat_block', actorId: userId, targetType: 'user', targetId: blockUserId, req });
}

/** Unblock a user. */
export async function unblockUser({ userId, blockUserId }) {
  await Block.deleteOne({ blocker: userId, blocked: blockUserId });
  await User.updateOne({ _id: userId }, { $pull: { blockedUsers: blockUserId } });
}

/** Report a user (spec §7 report user; admin moderation later). */
export async function reportUser({ userId, reportedId, reason, details, req }) {
  if (String(userId) === String(reportedId)) throw badRequest('You cannot report yourself', 'SELF_REPORT');
  const existing = await Report.findOne({ reporter: userId, targetType: 'user', targetId: reportedId, status: 'pending' });
  if (existing) throw badRequest('You have already reported this user', 'ALREADY_REPORTED');

  await Report.create({ reporter: userId, targetType: 'user', targetId: reportedId, reason, details });
  await logAudit({ action: 'report_resolve', actorId: userId, targetType: 'user', targetId: reportedId, details: { reason }, req });
}

export { isUserOnline };
