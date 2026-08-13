import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { connectSocket, disconnectSocket } from '../socket/client.js';
import { prependNotification } from '../store/slices/notificationSlice.js';
import { NOTIFICATION_TYPE_META } from '../constants/index.js';

/**
 * Keeps the socket alive while authenticated and wires real-time events:
 * - notification:new → store (unread badge + latest list) + toast
 * Disconnects when the session ends.
 */
export function useAuthSocket() {
  const dispatch = useDispatch();
  const accessToken = useSelector((state) => state.auth.accessToken);
  const location = window.location.pathname;

  useEffect(() => {
    if (!accessToken) {
      disconnectSocket();
      return undefined;
    }

    const socket = connectSocket(accessToken);

    const onNotification = (payload) => {
      const notification = payload?.notification;
      if (!notification) return;
      dispatch(prependNotification(notification));

      const meta = NOTIFICATION_TYPE_META[notification.type];
      if (!location.startsWith('/notifications')) {
        toast(notification.title, {
          description: notification.body || meta?.label || '',
          position: 'bottom-right',
        });
      }
    };

    socket.on('notification:new', onNotification);
    socket.on('connect_error', () => {
      // Non-fatal: REST still works; socket retries with backoff.
    });

    return () => {
      socket.off('notification:new', onNotification);
    };
  }, [accessToken, dispatch, location]);
}
