import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { verifyAccessToken } from '../utils/tokens.js';
import User from '../models/user.js';
import { registerChatHandlers } from './chat.js';

let io = null;

/** In-memory presence: userId → Set of socket ids. */
const presence = new Map();

export function markOnline(userId, socketId) {
  if (!presence.has(userId)) presence.set(userId, new Set());
  presence.get(userId).add(socketId);
}

export function markOffline(userId, socketId) {
  const sockets = presence.get(userId);
  if (!sockets) return;
  sockets.delete(socketId);
  if (sockets.size === 0) presence.delete(userId);
}

export function isUserOnline(userId) {
  return presence.has(String(userId));
}

export function getOnlineUserIds() {
  return [...presence.keys()];
}

/**
 * Initialize Socket.IO on the HTTP server.
 * Handshake is authenticated with the same JWT access token used for REST.
 */
export function initSocket(server) {
  io = new Server(server, {
    cors: { origin: env.allowedOrigins, credentials: true },
    pingInterval: 25_000,
    pingTimeout: 20_000,
  });

  // Socket handshake authentication.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('NO_ACCESS_TOKEN'));

      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.sub).select('_id role isActive isVerified isApproved').lean();
      if (!user || !user.isActive || !user.isVerified || !user.isApproved) {
        return next(new Error('ACCOUNT_INVALID'));
      }

      socket.data.userId = user._id.toString();
      socket.data.role = user.role;
      next();
    } catch {
      next(new Error('UNAUTHORIZED'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;

    // Personal room — real-time notifications/messages are delivered here.
    socket.join(`user:${userId}`);

    // Presence: mark online + broadcast to everyone (conversation peers listen).
    const wasOffline = !isUserOnline(userId);
    markOnline(userId, socket.id);
    if (wasOffline) socket.broadcast.emit('user:online', { userId });

    socket.emit('connected', { userId });

    // Conversation rooms + chat events.
    registerChatHandlers(io, socket);

    socket.on('disconnect', () => {
      markOffline(userId, socket.id);
      if (!isUserOnline(userId)) {
        socket.broadcast.emit('user:offline', { userId });
      }
      socket.leave(`user:${userId}`);
    });
  });

  console.log('[sockets] initialized');
  return io;
}

/** Access the Socket.IO instance (null before init). */
export function getIO() {
  return io;
}
