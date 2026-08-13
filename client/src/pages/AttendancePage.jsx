import { Link } from 'react-router';
import { CheckCircle2, ClipboardCheck, XCircle } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useGetMyAttendanceQuery } from '../services/attendanceApi.js';
import { useGetEventsQuery } from '../services/eventsApi.js';
import { QrScanner } from '../components/feature/attendance/QrScanner.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { ListSkeleton } from '../components/ui/Skeleton.jsx';
import { StatCard } from '../components/ui/StatCard.jsx';
import { formatDate, formatTime } from '../utils/format.js';
import { cn } from '../utils/cn.js';

const STATUS_TONE = { present: 'success', late: 'warning', absent: 'danger', registered: 'slate' };

/**
 * Attendance page (spec §10):
 * - upcoming events with QR check-in scanner
 * - personal attendance history with stats
 */
export function AttendancePage() {
  useDocumentTitle('Attendance');
  const me = useSelector((state) => state.auth.user);

  const { data: myAttendance, isLoading, isError, refetch } = useGetMyAttendanceQuery(me?._id, { skip: !me });
  const { data: eventsData } = useGetEventsQuery({ period: 'upcoming', page: 1, limit: 20 });

  const records = myAttendance?.data?.items ?? [];
  const upcomingEvents = eventsData?.data?.items ?? [];

  const present = records.filter((record) => record.status === 'present' || record.status === 'late').length;
  const total = records.filter((record) => ['present', 'late', 'absent'].includes(record.status)).length;
  const percent = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <ClipboardCheck className="size-5 text-primary-600" aria-hidden="true" />
          Attendance
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Check in at events with the event QR code — your attendance is recorded automatically.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Events attended" value={present} icon={CheckCircle2} />
        <StatCard label="Events missed" value={records.filter((record) => record.status === 'absent').length} icon={XCircle} />
        <StatCard label="Attendance rate" value={`${percent}%`} icon={ClipboardCheck} />
      </div>

      {/* Upcoming events + check-in */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming events — check in here</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length === 0 ? (
            <EmptyState title="No upcoming events" description="Events you register for will appear here for QR check-in." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcomingEvents.map((event) => (
                <li key={event._id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <Link to={`/events/${event._id}`} className="text-sm font-semibold text-slate-900 hover:text-primary-600">
                      {event.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {formatDate(event.date)}
                      {event.startTime ? ` · ${formatTime(event.startTime)}` : ''}
                      {event.venue ? ` · ${event.venue}` : ''}
                    </p>
                  </div>
                  <QrScanner eventTitle={event.title} />
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-slate-400">
            You must be registered for the event before checking in. Only the current QR code works — codes expire within minutes.
          </p>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>Your attendance history</CardTitle>
        </CardHeader>
        <CardContent>
          {isError ? (
            <ErrorState onRetry={refetch} />
          ) : isLoading ? (
            <ListSkeleton rows={4} />
          ) : records.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="No attendance records yet"
              description="Check in at your next event and it will show up here."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {records.map((record) => (
                <li key={record._id} className="flex items-center gap-3 py-3">
                  <span
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-xl',
                      record.status === 'present' || record.status === 'late' ? 'bg-accent-50' : 'bg-red-50',
                    )}
                  >
                    {record.status === 'present' || record.status === 'late' ? (
                      <CheckCircle2 className="size-4.5 text-accent-600" aria-hidden="true" />
                    ) : (
                      <XCircle className="size-4.5 text-red-500" aria-hidden="true" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{record.event?.title ?? 'Event'}</p>
                    <p className="text-xs text-slate-400">
                      {record.event ? formatDate(record.event.date) : ''}
                      {record.checkInTime ? ` · Checked in ${formatTime(new Date(record.checkInTime).toTimeString().slice(0, 5))}` : ''}
                      {record.method === 'manual' ? ' · Marked by organizer' : ''}
                    </p>
                  </div>
                  <Badge tone={STATUS_TONE[record.status] ?? 'slate'}>{record.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
