import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { getSocket } from '../socket/client.js';

/**
 * Real-time chat hook (spec §7).
 * Joins the conversation room on mount and wires:
 * - message:new → append incoming messages
 * - messages:read → mark my sent messages as read
 * - typing:start/stop → typing indicator
 * - user:online/offline → presence dot
 *
 * Exposes sendMessage (with ack-based errors), emitTyping, and markRead.
 */
export function useChatSocket({ conversationId, otherUserId }) {
  const accessToken = useSelector((state) => state.auth.accessToken);
  const [typingUsers, setTypingUsers] = useState([]);
  const [online, setOnline] = useState(false);
  const listenersRef = useRef({});
  const typingTimerRef = useRef(null);

  useEffect(() => {
    if (!accessToken || !conversationId) return undefined;
    const socket = getSocket();
    if (!socket) return undefined;

    const onMessageNew = (payload) => {
      listenersRef.current.onMessageNew?.(payload);
    };
    const onMessagesRead = (payload) => {
      listenersRef.current.onMessagesRead?.(payload);
    };
    const onTyping = (payload) => {
      if (payload.userId === otherUserId) {
        setTypingUsers([payload.userId]);
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setTypingUsers([]), 2500);
      }
    };
    const onTypingStop = (payload) => {
      if (payload.userId === otherUserId) setTypingUsers([]);
    };
    const onUserOnline = ({ userId }) => {
      if (String(userId) === String(otherUserId)) setOnline(true);
    };
    const onUserOffline = ({ userId }) => {
      if (String(userId) === String(otherUserId)) setOnline(false);
    };

    socket.emit('conversation:join', { conversationId });
    socket.on('message:new', onMessageNew);
    socket.on('messages:read', onMessagesRead);
    socket.on('typing:start', onTyping);
    socket.on('typing:stop', onTypingStop);
    socket.on('user:online', onUserOnline);
    socket.on('user:offline', onUserOffline);

    // Initial presence check.
    if (otherUserId) {
      socket.emit('presence:get', { userIds: [otherUserId] }, (response) => {
        if (response?.online?.includes(String(otherUserId))) setOnline(true);
      });
    }

    return () => {
      clearTimeout(typingTimerRef.current);
      socket.emit('conversation:leave', { conversationId });
      socket.off('message:new', onMessageNew);
      socket.off('messages:read', onMessagesRead);
      socket.off('typing:start', onTyping);
      socket.off('typing:stop', onTypingStop);
      socket.off('user:online', onUserOnline);
      socket.off('user:offline', onUserOffline);
    };
  }, [accessToken, conversationId, otherUserId]);

  const sendMessage = (payload) =>
    new Promise((resolve, reject) => {
      const socket = getSocket();
      if (!socket) return reject(new Error('Not connected'));
      socket.emit('message:send', payload, (response) => {
        if (response?.ok) resolve(response.message);
        else {
          const error = new Error(response?.message ?? 'Could not send message');
          error.code = response?.code;
          if (response?.code === 'CHAT_BLOCKED') {
            toast.error('Messaging is blocked with this user.');
          }
          reject(error);
        }
      });
    });

  const emitTyping = (isTyping) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit(isTyping ? 'typing:start' : 'typing:stop', { conversationId });
  };

  const markRead = (messageIds) => {
    const socket = getSocket();
    if (!socket || messageIds.length === 0) return;
    socket.emit('message:read', { conversationId, messageIds });
  };

  return {
    typingUsers,
    online,
    sendMessage,
    emitTyping,
    markRead,
    setMessageListener: (fn) => {
      listenersRef.current.onMessageNew = fn;
    },
    setReadListener: (fn) => {
      listenersRef.current.onMessagesRead = fn;
    },
  };
}
