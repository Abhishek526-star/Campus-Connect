import { io } from 'socket.io-client';

/**
 * Singleton Socket.IO client. Connects to the same origin (Vite dev proxy /
 * Vercel rewrites) unless VITE_SOCKET_URL is set for a separate socket host.
 */
let socket = null;

export function connectSocket(token) {
  if (socket?.connected) return socket;

  const url = import.meta.env.VITE_SOCKET_URL || undefined;
  socket = io(url, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
