import { Link } from 'react-router';
import { CalendarDays, Clock, MapPin, MonitorPlay, Users, Video } from 'lucide-react';
import { Avatar } from '../../ui/Avatar.jsx';
import { Badge } from '../../ui/Badge.jsx';
import { Card } from '../../ui/Card.jsx';
import { formatDate, formatTime } from '../../../utils/format.js';
import { cn } from '../../../utils/cn.js';

const STATUS_TONE = {
  scheduled: 'primary',
  pending: 'warning',
  accepted: 'success',
  rejected: 'danger',
  completed: 'slate',
  cancelled: 'danger',
};

/** Meeting card — title, status, time, participants, organizer. */
export function MeetingCard({ meeting }) {
  const accepted = meeting.participants?.filter((p) => p.status === 'accepted').length ?? 0;
  const total = meeting.participants?.length ?? 0;

  return (
    <Card className="flex h-full flex-col p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-50">
          <Video className="size-5 text-violet-600" aria-hidden="true" />
        </span>
        <Badge tone={STATUS_TONE[meeting.status] ?? 'slate'}>{meeting.status}</Badge>
      </div>

      <Link to={`/meetings/${meeting._id}`} className="mt-3 block">
        <h3 className="line-clamp-1 text-base font-semibold text-slate-900 hover:text-primary-600">{meeting.title}</h3>
      </Link>

      <div className="mt-3 space-y-1.5 text-xs text-slate-500">
        <p className="flex items-center gap-2">
          <CalendarDays className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          {formatDate(meeting.date)}
        </p>
        <p className="flex items-center gap-2">
          <Clock className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          {formatTime(meeting.startTime)}
          {meeting.endTime ? ` – ${formatTime(meeting.endTime)}` : ''}
        </p>
        {meeting.location && (
          <p className="flex items-center gap-2">
            <MapPin className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" /> {meeting.location}
          </p>
        )}
        {meeting.meetingLink && (
          <p className="flex items-center gap-2">
            <MonitorPlay className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
            <span className="truncate text-accent-600">Online meeting link</span>
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="flex items-center gap-2 text-xs text-slate-500">
          <Avatar src={meeting.organizer?.avatar?.url} name={meeting.organizer?.name} size="xs" />
          <span className="max-w-32 truncate">{meeting.organizer?.name ?? 'Organizer'}</span>
        </span>
        <span className={cn('inline-flex items-center gap-1 text-[11px] text-slate-400')}>
          <Users className="size-3.5" aria-hidden="true" />
          {accepted}/{total} accepted
        </span>
      </div>
    </Card>
  );
}
