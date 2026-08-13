import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Bell, BellRing, CheckCheck, MailOpen, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useRealtimeNotificationCount } from '../hooks/useRealtimeNotifications.js';
import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
  useClearNotificationsMutation,
} from '../services/notificationApi.js';
import { getErrorMessage, NOTIFICATION_TYPE_META } from '../constants/index.js';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { Tabs } from '../components/ui/Tabs.jsx';
import { Select } from '../components/ui/Select.jsx';
import { ListSkeleton } from '../components/ui/Skeleton.jsx';
import { timeAgo } from '../utils/format.js';
import { cn } from '../utils/cn.js';

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  ...Object.entries(NOTIFICATION_TYPE_META).map(([value, meta]) => ({ value, label: meta.label })),
];

/**
 * Notifications center (spec §18):
 * - real-time (socket pushes update the list), unread badge sync
 * - tabs: All / Unread · type filter · server-side pagination
 * - mark read (click), mark all read, delete, clear all
 */
export function NotificationsPage() {
  useDocumentTitle('Notifications');
  const navigate = useNavigate();
  const [tab, setTab] = useState('all');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [confirmClear, setConfirmClear] = useState(false);

  const params = useMemo(
    () => ({
      page,
      limit: 15,
      type: type || undefined,
      isRead: tab === 'unread' ? 'false' : undefined,
    }),
    [page, type, tab],
  );

  const { data, isLoading, isFetching, isError, refetch } = useGetNotificationsQuery(params);
  const [markRead] = useMarkNotificationReadMutation();
  const [markAll] = useMarkAllNotificationsReadMutation();
  const [remove] = useDeleteNotificationMutation();
  const [clearAll, { isLoading: clearing }] = useClearNotificationsMutation();

  const items = data?.data?.items ?? [];
  const meta = data?.data?.meta;

  // Real-time: refetch when a socket notification arrives.
  const realtimeCount = useRealtimeNotificationCount();
  useEffect(() => {
    if (realtimeCount > 0) refetch();
  }, [realtimeCount, refetch]);

  const handleClick = async (notification) => {
    if (!notification.isRead) {
      await markRead(notification._id).unwrap().catch(() => {});
    }
    if (notification.data?.url) navigate(notification.data.url);
  };

  const handleMarkAll = async () => {
    try {
      await markAll().unwrap();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update notifications.'));
    }
  };

  const handleDelete = async (id) => {
    try {
      await remove(id).unwrap();
      toast.success('Notification deleted');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not delete the notification.'));
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAll().unwrap();
      toast.success('All notifications cleared');
      setConfirmClear(false);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not clear notifications.'));
    }
  };

  const unreadInList = items.filter((item) => !item.isRead).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <BellRing className="size-5 text-primary-600" aria-hidden="true" />
            Notifications
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Messages, events, meetings, scholarships, and community updates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadInList > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAll}>
              <CheckCheck className="size-3.5" aria-hidden="true" /> Mark all read
            </Button>
          )}
          {items.length > 0 && (
            <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => setConfirmClear(true)}>
              <Trash2 className="size-3.5" aria-hidden="true" /> Clear all
            </Button>
          )}
        </div>
      </div>

      {/* Tabs + type filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={tab}
          onChange={(value) => {
            setTab(value);
            setPage(1);
          }}
          tabs={[
            { value: 'all', label: 'All' },
            { value: 'unread', label: 'Unread' },
          ]}
        />
        <Select
          aria-label="Filter by type"
          value={type}
          onChange={(event) => {
            setType(event.target.value);
            setPage(1);
          }}
          options={TYPE_OPTIONS}
          className="sm:w-56"
        />
      </div>

      {/* List */}
      {isError ? (
        <ErrorState title="Could not load notifications" onRetry={refetch} />
      ) : isLoading ? (
        <Card>
          <CardContent>
            <ListSkeleton rows={6} />
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={tab === 'unread' || type ? 'No matching notifications' : 'No notifications yet'}
          description={
            tab === 'unread' || type
              ? 'Try changing the filter or tab.'
              : 'When someone messages you, sends a request, or shares an update, it will show up here.'
          }
        />
      ) : (
        <>
          <Card>
            <CardContent className="p-2 sm:p-3">
              <ul className="divide-y divide-slate-100">
                {items.map((notification) => {
                  const meta = NOTIFICATION_TYPE_META[notification.type];
                  return (
                    <li key={notification._id}>
                      <button
                        type="button"
                        onClick={() => handleClick(notification)}
                        className={cn(
                          'flex w-full items-start gap-3 rounded-xl px-3 py-3.5 text-left transition-colors',
                          !notification.isRead ? 'bg-primary-50/60 hover:bg-primary-50' : 'hover:bg-slate-50',
                        )}
                      >
                        <span
                          className={cn(
                            'flex size-10 shrink-0 items-center justify-center rounded-xl',
                            notification.isRead ? 'bg-slate-100' : 'bg-primary-100',
                          )}
                        >
                          <Bell className={cn('size-5', notification.isRead ? 'text-slate-400' : 'text-primary-600')} aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-3">
                            <span className="min-w-0">
                              <span className={cn('block truncate text-sm', notification.isRead ? 'font-medium text-slate-700' : 'font-semibold text-slate-900')}>
                                {notification.title}
                              </span>
                              {notification.body && (
                                <span className="mt-0.5 line-clamp-2 block text-xs text-slate-500">{notification.body}</span>
                              )}
                            </span>
                            {!notification.isRead && (
                              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary-500" aria-label="Unread" />
                            )}
                          </span>
                          <span className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-400">
                            <Badge tone={meta?.tone ?? 'slate'} size="sm">{meta?.label ?? notification.type}</Badge>
                            {timeAgo(notification.createdAt)}
                          </span>
                        </span>
                        <span className="shrink-0 self-center opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100" onClick={(event) => event.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDelete(notification._id);
                            }}
                            aria-label="Delete notification"
                            className="rounded-full p-1.5 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          <div className="flex flex-col items-center gap-2">
            {isFetching && <p className="text-xs text-slate-400">Updating…</p>}
            <Pagination page={meta?.page ?? 1} totalPages={meta?.totalPages ?? 1} onChange={setPage} />
            <p className="text-xs text-slate-400">{meta?.total ?? 0} notifications</p>
          </div>
        </>
      )}

      <p className="flex items-center justify-center gap-2 text-xs text-slate-400">
        <MailOpen className="size-3.5" aria-hidden="true" />
        Unread notifications also arrive by email when the sender isn't online.
      </p>

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={handleClearAll}
        loading={clearing}
        title="Clear all notifications?"
        description="This permanently deletes every notification in your inbox."
        confirmLabel="Clear all"
      />
    </div>
  );
}
