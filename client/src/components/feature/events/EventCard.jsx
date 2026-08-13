import { Link } from 'react-router';
import { useSelector } from 'react-redux';
import { CalendarDays, Clock, MapPin, Users } from 'lucide-react';
import { Badge } from '../../ui/Badge.jsx';
import { Card } from '../../ui/Card.jsx';
import { Avatar } from '../../ui/Avatar.jsx';
import { QrGenerator } from '../attendance/QrGenerator.jsx';
import { formatDate, formatTime } from '../../../utils/format.js';
import { EVENT_CATEGORY_LABELS, EVENT_MODE_LABELS } from '../../../constants/index.js';
import { cn } from '../../../utils/cn.js';

/**
 * Event card (spec §9): date chip, title, category + mode badges, venue,
 * registration progress, organizer. Organizers/admins also get the QR
 * attendance icon (spec §10) — the server enforces the same permission.
 */
export function EventCard({ event, compact = false }) {
  const me = useSelector((state) => state.auth.user);
  const dateLabel = formatDate(event.date).split(' ');
  const percent = event.maxParticipants ? Math.round((event.registrationsCount / event.maxParticipants) * 100) : 0;
  const canManageAttendance = me?.role === 'admin' || (event.organizer?._id && me?._id === event.organizer._id);

  return (
    <Card className={cn('group flex h-full flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md', compact && 'hover:translate-y-0')}>
      {/* Cover / date banner */}
      {event.image?.url ? (
        <img src={event.image.url} alt="" className="h-32 w-full object-cover" loading="lazy" />
      ) : (
        <div className="relative h-32 w-full bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700">
          <div
            className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '22px 22px' }}
            aria-hidden="true"
          />
          <div className="absolute left-4 top-4 flex size-12 flex-col items-center justify-center rounded-xl bg-white/95 shadow-lg">
            <span className="text-sm font-bold leading-none text-primary-700">{dateLabel[0]}</span>
            <span className="text-[10px] font-semibold uppercase text-slate-500">{dateLabel[1]}</span>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="primary" size="sm">{EVENT_CATEGORY_LABELS[event.category] ?? event.category}</Badge>
          <Badge tone={event.mode === 'online' ? 'accent' : 'slate'} size="sm">{EVENT_MODE_LABELS[event.mode] ?? event.mode}</Badge>
          {event.status === 'cancelled' && <Badge tone="danger" size="sm">Cancelled</Badge>}
          {event.status === 'completed' && <Badge tone="slate" size="sm">Completed</Badge>}
        </div>

        <Link to={`/events/${event._id}`} className="mt-2.5 block">
          <h3 className="line-clamp-2 text-base font-semibold text-slate-900 transition-colors group-hover:text-primary-700">
            {event.title}
          </h3>
        </Link>

        <div className="mt-3 space-y-1.5 text-xs text-slate-500">
          <p className="flex items-center gap-2">
            <CalendarDays className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
            {formatDate(event.date)}
            {event.startTime && (
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5 text-slate-400" aria-hidden="true" /> {formatTime(event.startTime)}
                {event.endTime ? `–${formatTime(event.endTime)}` : ''}
              </span>
            )}
          </p>
          {event.venue && (
            <p className="flex items-center gap-2">
              <MapPin className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
              <span className="truncate">{event.venue}</span>
            </p>
          )}
          <p className="flex items-center gap-2">
            <Users className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
            {event.registrationsCount}/{event.maxParticipants} registered
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5">
          <span className="flex items-center gap-2 text-xs text-slate-500">
            <Avatar src={event.organizer?.avatar?.url} name={event.organizer?.name} size="xs" />
            <span className="max-w-32 truncate">{event.organizer?.name ?? 'Organizer'}</span>
          </span>
          <div className="flex items-center gap-2">
            {canManageAttendance && (
              <QrGenerator eventId={event._id} eventTitle={event.title} compact />
            )}
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
              <div
                className={cn('h-full rounded-full', percent >= 90 ? 'bg-red-500' : 'bg-primary-600')}
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="text-[10px] font-semibold text-slate-400">{percent}%</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
