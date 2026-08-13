import { markMessagesRead, persistMessage } from '../services/chatService.js';
import { createNotification } from '../services/notificationService.js';
import { isUserOnline } from './index.js';

/**
 * Real-time chat events (spec §7):
 * - conversation:join / conversation:leave → socket rooms
 * - message:send → persist + broadcast message:new (+ notification when recipient offline)
 * - message:read → mark read + broadcast messages:read
 * - typing:start / typing:stop → broadcast to conversation room
 * - presence:get → online status for a set of users
 */
export function registerChatHandlers(io, socket) {
  const userId = socket.data.userId;

  const conversationRoom = (conversationId) => `conversation:${conversationId}`;

  socket.on('conversation:join', ({ conversationId }, ack) => {
    socket.join(conversationRoom(conversationId));
    ack?.({ ok: true });
  });

  socket.on('conversation:leave', ({ conversationId }, ack) => {
    socket.leave(conversationRoom(conversationId));
    ack?.({ ok: true });
  });

  socket.on('message:send', async ({ conversationId, content, kind = 'text', attachment = null }, ack) => {
    try {
      const { message, otherId } = await persistMessage({
        conversationId,
        senderId: userId,
        content,
        kind,
        attachment,
      });

      // Deliver to everyone in the conversation room except the sender.
      socket.to(conversationRoom(conversationId)).emit('message:new', { conversationId, message });
      ack?.({ ok: true, message });

      // Notify the recipient when they are not actively viewing this chat.
      if (otherId) {
        const room = io.sockets.adapter.rooms.get(conversationRoom(conversationId));
        const recipientPresent = room && [...room].some((id) => {
          const s = io.sockets.sockets.get(id);
          return s && s.data.userId === String(otherId);
        });
        if (!recipientPresent) {
          await createNotification({
            recipientId: otherId,
            type: 'message',
            title: 'New message',
            body: message.kind === 'text' ? message.content.slice(0, 120) : `${message.kind === 'image' ? '📷 Photo' : '📎 File'} shared`,
            data: { url: `/messages/${conversationId}`, conversationId },
          });
        }
      }
    } catch (error) {
      ack?.({ ok: false, code: error.code ?? 'MESSAGE_FAILED', message: error.message });
    }
  });

  socket.on('message:read', async ({ conversationId, messageIds = [] }, ack) => {
    try {
      await markMessagesRead({ conversationId, userId, messageIds });
      socket.to(conversationRoom(conversationId)).emit('messages:read', { conversationId, messageIds, userId });
      ack?.({ ok: true });
    } catch (error) {
      ack?.({ ok: false, code: error.code ?? 'READ_FAILED', message: error.message });
    }
  });

  socket.on('typing:start', ({ conversationId }, ack) => {
    socket.to(conversationRoom(conversationId)).emit('typing:start', { conversationId, userId });
    ack?.({ ok: true });
  });

  socket.on('typing:stop', ({ conversationId }, ack) => {
    socket.to(conversationRoom(conversationId)).emit('typing:stop', { conversationId, userId });
    ack?.({ ok: true });
  });

  socket.on('presence:get', async ({ userIds = [] }, ack) => {
    const online = userIds.filter((id) => isUserOnline(id));
    ack?.({ online });
  });

  // Broadcast helper used by the REST layer (e.g. message:deleted after delete-for-self).
  socket.on('message:deleted', ({ conversationId, messageId }, ack) => {
    socket.to(conversationRoom(conversationId)).emit('message:deleted', { conversationId, messageId, userId });
    ack?.({ ok: true });
  });
}


