import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  MonitorPlay,
  Pencil,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import {
  useGetEventQuery,
  useGetEventParticipantsQuery,
  useRegisterForEventMutation,
  useCancelEventRegistrationMutation,
  useDeleteEventMutation,
} from '../services/eventsApi.js';
import { getErrorMessage, EVENT_CATEGORY_LABELS, EVENT_MODE_LABELS } from '../constants/index.js';
import { Avatar } from '../components/ui/Avatar.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card.jsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { ProgressBar } from '../components/ui/ProgressBar.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { RoleBadge } from '../components/common/RoleBadge.jsx';
import { EventFormModal } from '../components/feature/events/EventFormModal.jsx';
import { formatDate, formatTime } from '../utils/format.js';

function InfoRow({ icon: Icon, label, value }) {
  return value ? (
    <div className="flex items-start gap-3 py-2.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-50">
        <Icon className="size-4.5 text-primary-600" aria-hidden="true" />
      </span>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-slate-800">{value}</p>
      </div>
    </div>
  ) : null;
}

/**
 * Event details (spec §9): full info, register/cancel (real records),
 * organizer controls (edit/delete/participants).
 */
export function EventDetailsPage() {
  useDocumentTitle('Event');
  const { id } = useParams();
  const navigate = useNavigate();
  const me = useSelector((state) => state.auth.user);

  const { data, isLoading, isError, refetch } = useGetEventQuery(id);
  const { data: participantsData, isLoading: participantsLoading } = useGetEventParticipantsQuery(id, {
    skip: !me, // server enforces organizer/admin access
  });

  const [register, { isLoading: registering }] = useRegisterForEventMutation();
  const [cancelReg, { isLoading: cancelling }] = useCancelEventRegistrationMutation();
  const [deleteEvent, { isLoading: deleting }] = useDeleteEventMutation();

  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isError) {
    return <ErrorState title="Could not load this event" onRetry={refetch} />;
  }

  if (isLoading || !data?.data) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-32" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  const { event } = data.data;
  const isOrganizer = me && (me.role === 'admin' || event.organizer?._id === me._id);
  const registration = event.myRegistration;
  const isRegistered = registration?.status === 'registered';
  const deadlinePassed = event.registrationDeadline && new Date(event.registrationDeadline) < new Date();
  const full = event.registrationsCount >= event.maxParticipants;
  const percent = event.maxParticipants ? Math.round((event.registrationsCount / event.maxParticipants) * 100) : 0;

  const participants = participantsData?.data?.items ?? [];
  const canSeeParticipants = isOrganizer;

  const handleRegister = async () => {    try {
      await register(id).unwrap();
      toast.success('You are registered for this event!');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not register for the event.'));
    }
  };

  const handleCancelRegistration = async () => {
    try {
      await cancelReg(id).unwrap();
      toast.success('Registration cancelled');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not cancel the registration.'));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteEvent(id).unwrap();
      toast.success('Event deleted');
      navigate('/events');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not delete the event.'));
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="size-4" aria-hidden="true" /> Back
      </Button>

      {/* Hero */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {event.image?.url ? (
          <img src={event.image.url} alt="" className="h-56 w-full object-cover sm:h-64" />
        ) : (
          <div className="relative h-40 w-full bg-gradient-to-br from-primary-700 via-primary-800 to-accent-800 sm:h-48">
            <div
              className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '26px 26px' }}
              aria-hidden="true"
            />
          </div>
        )}
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="primary">{EVENT_CATEGORY_LABELS[event.category] ?? event.category}</Badge>
            <Badge tone={event.mode === 'online' ? 'accent' : 'slate'}>{EVENT_MODE_LABELS[event.mode] ?? event.mode}</Badge>
            {event.department && <Badge tone="violet">{event.department}</Badge>}
            {event.status === 'cancelled' && <Badge tone="danger">Cancelled</Badge>}
            {event.status === 'completed' && <Badge tone="slate">Completed</Badge>}
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{event.title}</h1>

          <div className="mt-4 grid gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
            <InfoRow icon={CalendarDays} label="Date" value={formatDate(event.date)} />
            <InfoRow icon={Clock} label="Time" value={event.startTime ? `${formatTime(event.startTime)}${event.endTime ? ` – ${formatTime(event.endTime)}` : ''}` : ''} />
            <InfoRow icon={MapPin} label="Venue" value={event.venue || (event.mode === 'online' ? 'Online event' : '')} />
          </div>

          {event.meetingLink && (
            <a
              href={event.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent-50 px-4 py-2 text-sm font-semibold text-accent-700 ring-1 ring-accent-200 transition-colors hover:bg-accent-100"
            >
              <MonitorPlay className="size-4" aria-hidden="true" /> Join online meeting
            </a>
          )}

          <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-slate-600">{event.description}</p>

          {/* Organizer + registration */}
          <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Link to={`/profile/${event.organizer?._id}`}>
                <Avatar src={event.organizer?.avatar?.url} name={event.organizer?.name} size="md" />
              </Link>
              <div>
                <p className="text-xs text-slate-400">Organized by</p>
                <Link to={`/profile/${event.organizer?._id}`} className="text-sm font-semibold text-slate-900 hover:text-primary-600">
                  {event.organizer?.name ?? 'Organizer'}
                </Link>
                <div className="mt-0.5"><RoleBadge role={event.organizer?.role} size="sm" /></div>
              </div>
            </div>

            {!isOrganizer && event.status === 'published' && (
              <div className="flex flex-col items-start gap-2 sm:items-end">
                {isRegistered ? (
                  <Button variant="outline" onClick={handleCancelRegistration} loading={cancelling}>
                    Cancel registration
                  </Button>
                ) : (
                  <Button onClick={handleRegister} loading={registering} disabled={deadlinePassed || full || event.status !== 'published'}>
                    <UserPlus className="size-4" aria-hidden="true" />
                    {deadlinePassed ? 'Registration closed' : full ? 'Event full' : 'Register for event'}
                  </Button>
                )}
                <p className="text-xs text-slate-400">
                  {isRegistered ? 'You are registered ✓' : deadlinePassed ? `Closed on ${formatDate(event.registrationDeadline)}` : event.registrationDeadline ? `Deadline: ${formatDate(event.registrationDeadline)}` : 'Open until the event'}
                </p>
              </div>
            )}

            {isOrganizer && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditOpen(true)}>
                  <Pencil className="size-4" aria-hidden="true" /> Edit
                </Button>
                <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="size-4" aria-hidden="true" /> Delete
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Capacity */}
      <Card>
        <CardContent className="py-5">
          <div className="flex items-center justify-between text-sm">
            <p className="font-semibold text-slate-800">Registration progress</p>
            <p className="text-slate-500">
              <span className="font-bold text-primary-700">{event.registrationsCount}</span> / {event.maxParticipants} seats
            </p>
          </div>
          <ProgressBar value={percent} tone={percent >= 90 ? 'danger' : 'primary'} className="mt-3" />
        </CardContent>
      </Card>

      {/* Participants (organizer/admin only) */}
      {canSeeParticipants && (
        <Card>
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2">
              <Users className="size-4 text-primary-500" aria-hidden="true" />
              Participants
              <Badge tone="primary" size="sm">{participants.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {participantsLoading ? (
              <Skeleton className="h-24" />
            ) : participants.length === 0 ? (
              <EmptyState icon={Users} title="No registrations yet" description="Registered students will appear here." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {participants.map((registration) => (
                  <li key={registration._id} className="flex items-center gap-3 py-2.5">
                    <Avatar src={registration.user?.avatar?.url} name={registration.user?.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <Link to={`/profile/${registration.user?._id}`} className="text-sm font-semibold text-slate-900 hover:text-primary-600">
                        {registration.user?.name}
                      </Link>
                      <p className="text-xs text-slate-400">{registration.user?.email}</p>
                    </div>
                    <RoleBadge role={registration.user?.role} size="sm" />
                    <Badge tone={registration.status === 'registered' ? 'success' : 'slate'} size="sm">
                      {registration.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit modal */}
      {event && <EventFormModal open={editOpen} onClose={() => setEditOpen(false)} event={event} />}

      {/* Delete confirm */}
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this event?"
        description="This permanently deletes the event and all its registrations."
        confirmLabel="Delete event"
      />
    </div>
  );
}
