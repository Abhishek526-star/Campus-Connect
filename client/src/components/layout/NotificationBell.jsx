import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Bell, CheckCheck } from 'lucide-react';
import { useSelector } from 'react-redux';
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '../../services/notificationApi.js';
import { useClickOutside } from '../../hooks/useClickOutside.js';
import { IconButton } from '../ui/IconButton.jsx';
import { Avatar } from '../ui/Avatar.jsx';
import { timeAgo } from '../../utils/format.js';
import { cn } from '../../utils/cn.js';
import { NOTIFICATION_TYPE_META } from '../../constants/index.js';

/** Topbar bell with unread badge + dropdown panel (real API data). */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const unread = useSelector((state) => state.notifications.unreadCount);

  const { data, isLoading } = useGetNotificationsQuery({ page: 1, limit: 8 });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAll] = useMarkAllNotificationsReadMutation();

  useClickOutside(rootRef, () => setOpen(false), open);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const notifications = data?.data?.items ?? [];

  const handleClick = async (notification) => {
    if (!notification.isRead) await markRead(notification._id).unwrap().catch(() => {});
    setOpen(false);
    if (notification.data?.url) navigate(notification.data.url);
    else navigate('/notifications');
  };

  return (
    <div ref={rootRef} className="relative">
      <IconButton label={`Notifications${unread ? ` (${unread} unread)` : ''}`} onClick={() => setOpen((v) => !v)}>
        <Bell />
        {unread > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </IconButton>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAll().unwrap().catch(() => {})}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
              >
                <CheckCheck className="size-3.5" aria-hidden="true" /> Mark all read
              </button>
            )}
          </div>

          <ul className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <li className="px-4 py-8 text-center text-sm text-slate-400">Loading…</li>
            ) : notifications.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-slate-400">No notifications yet</li>
            ) : (
              notifications.map((notification) => {
                const meta = NOTIFICATION_TYPE_META[notification.type];
                return (
                  <li key={notification._id}>
                    <button
                      type="button"
                      onClick={() => handleClick(notification)}
                      className={cn(
                        'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50',
                        !notification.isRead && 'bg-primary-50/60',
                      )}
                    >
                      <Avatar name={notification.title} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-900">{notification.title}</span>
                        {notification.body && (
                          <span className="mt-0.5 line-clamp-2 block text-xs text-slate-500">{notification.body}</span>
                        )}
                        <span className="mt-1 block text-[11px] text-slate-400">
                          {timeAgo(notification.createdAt)} · {meta?.label ?? notification.type}
                        </span>
                      </span>
                      {!notification.isRead && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary-500" aria-label="Unread" />}
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate('/notifications');
            }}
            className="block w-full border-t border-slate-100 px-4 py-2.5 text-center text-xs font-semibold text-primary-600 hover:bg-slate-50"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}
