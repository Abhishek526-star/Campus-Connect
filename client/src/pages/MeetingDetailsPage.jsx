import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  Check,
  Clock,
  MapPin,
  MonitorPlay,
  Pencil,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import {
  useGetMeetingQuery,
  useRespondToMeetingMutation,
  useSetMeetingStatusMutation,
  useDeleteMeetingMutation,
  useSendMeetingReminderMutation,
} from '../services/meetingsApi.js';
import { getErrorMessage } from '../constants/index.js';
import { Avatar } from '../components/ui/Avatar.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card.jsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { MeetingFormModal } from '../components/feature/meetings/MeetingFormModal.jsx';
import { formatDate, formatTime } from '../utils/format.js';

const PARTICIPANT_TONE = { invited: 'warning', accepted: 'success', rejected: 'danger' };

function InfoRow({ icon: Icon, label, value }) {
  return value ? (
    <div className="flex items-start gap-3 py-2.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-50">
        <Icon className="size-4.5 text-violet-600" aria-hidden="true" />
      </span>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-slate-800">{value}</p>
      </div>
    </div>
  ) : null;
}

/**
 * Meeting details (spec §8): accept/reject invitations, join link,
 * reschedule/edit (organizer), cancel/complete, reminders, participants.
 */
export function MeetingDetailsPage() {
  useDocumentTitle('Meeting');
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useGetMeetingQuery(id);
  const [respond] = useRespondToMeetingMutation();
  const [setStatus] = useSetMeetingStatusMutation();
  const [deleteMeeting] = useDeleteMeetingMutation();
  const [sendReminder, { isLoading: reminding }] = useSendMeetingReminderMutation();

  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (isError) {
    return <ErrorState title="Could not load this meeting" onRetry={refetch} />;
  }

  if (isLoading || !data?.data) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-16" />
        <Skeleton className="h-48" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  const { meeting, participants, myStatus } = data.data;
  const isOrganizer = meeting.isOrganizer;
  const closed = meeting.status === 'cancelled' || meeting.status === 'completed';
  const invited = myStatus === 'invited' && !closed;

  const handleRespond = async (status) => {
    try {
      await respond({ id, status }).unwrap();
      toast.success(`Invitation ${status}`);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not respond.'));
    }
  };

  const handleStatus = async (status) => {
    try {
      await setStatus({ id, status }).unwrap();
      toast.success(status === 'cancelled' ? 'Meeting cancelled' : 'Meeting marked completed');
      setConfirmCancel(false);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update the meeting.'));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMeeting(id).unwrap();
      toast.success('Meeting deleted');
      navigate('/meetings');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not delete the meeting.'));
    }
  };

  const handleRemind = async () => {
    try {
      const { data: result } = await sendReminder(id).unwrap();
      toast.success(`Reminders sent to ${result.reminded} people`);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not send reminders.'));
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="size-4" aria-hidden="true" /> Back
      </Button>

      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="violet">{meeting.type === 'group' ? 'Group meeting' : 'One-on-one'}</Badge>
            <Badge
              tone={
                meeting.status === 'accepted'
                  ? 'success'
                  : meeting.status === 'cancelled' || meeting.status === 'rejected'
                    ? 'danger'
                    : meeting.status === 'completed'
                      ? 'slate'
                      : 'warning'
              }
            >
              {meeting.status}
            </Badge>
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{meeting.title}</h1>

          <div className="mt-4 grid gap-x-8 gap-y-1 sm:grid-cols-2">
            <InfoRow icon={CalendarDays} label="Date" value={formatDate(meeting.date)} />
            <InfoRow
              icon={Clock}
              label="Time"
              value={`${formatTime(meeting.startTime)}${meeting.endTime ? ` – ${formatTime(meeting.endTime)}` : ''}`}
            />
            <InfoRow icon={MapPin} label="Location" value={meeting.location || (meeting.meetingLink ? 'Online meeting' : '')} />
            <InfoRow icon={Users} label="Organizer" value={meeting.organizer?.name} />
          </div>

          {meeting.description && (
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-600">{meeting.description}</p>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5">
            {meeting.meetingLink && !closed && (
              <a
                href={meeting.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-700"
              >
                <MonitorPlay className="size-4" aria-hidden="true" /> Join meeting
              </a>
            )}

            {invited && (
              <>
                <Button variant="success" onClick={() => handleRespond('accepted')}>
                  <Check className="size-4" aria-hidden="true" /> Accept
                </Button>
                <Button variant="outline" onClick={() => handleRespond('rejected')}>
                  <X className="size-4" aria-hidden="true" /> Decline
                </Button>
              </>
            )}

            {isOrganizer && !closed && (
              <>
                <Button variant="outline" onClick={() => setEditOpen(true)}>
                  <Pencil className="size-4" aria-hidden="true" /> Reschedule / edit
                </Button>
                <Button variant="outline" onClick={handleRemind} loading={reminding}>
                  <Bell className="size-4" aria-hidden="true" /> Send reminder
                </Button>
                <Button variant="outline" className="text-accent-700" onClick={() => handleStatus('completed')}>
                  <Check className="size-4" aria-hidden="true" /> Mark completed
                </Button>
                <Button variant="danger" onClick={() => setConfirmCancel(true)}>
                  Cancel meeting
                </Button>
              </>
            )}

            {isOrganizer && (
              <Button variant="ghost" className="ml-auto text-red-600 hover:bg-red-50" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="size-4" aria-hidden="true" /> Delete
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Participants */}
      <Card>
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <Users className="size-4 text-violet-500" aria-hidden="true" />
            Participants
            <Badge tone="primary" size="sm">{participants.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <EmptyState icon={Users} title="No participants" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {/* Organizer row */}
              <li className="flex items-center gap-3 py-2.5">
                <Avatar src={meeting.organizer?.avatar?.url} name={meeting.organizer?.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <Link to={`/profile/${meeting.organizer?._id}`} className="text-sm font-semibold text-slate-900 hover:text-primary-600">
                    {meeting.organizer?.name}
                  </Link>
                  <p className="text-xs text-slate-400">{meeting.organizer?.role}</p>
                </div>
                <Badge tone="primary">Organizer</Badge>
              </li>
              {participants.map((participant) => (
                <li key={participant._id} className="flex items-center gap-3 py-2.5">
                  <Avatar src={participant.user?.avatar?.url} name={participant.user?.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/profile/${participant.user?._id}`} className="text-sm font-semibold text-slate-900 hover:text-primary-600">
                      {participant.user?.name}
                    </Link>
                    <p className="text-xs text-slate-400">{participant.user?.role}</p>
                  </div>
                  <Badge tone={PARTICIPANT_TONE[participant.status] ?? 'slate'}>{participant.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {meeting && <MeetingFormModal open={editOpen} onClose={() => setEditOpen(false)} meeting={meeting} />}

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => handleStatus('cancelled')}
        title="Cancel this meeting?"
        description="All participants will be notified that the meeting is cancelled."
        confirmLabel="Cancel meeting"
      />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete this meeting?"
        description="This permanently deletes the meeting and all participant records."
        confirmLabel="Delete meeting"
      />
    </div>
  );
}
