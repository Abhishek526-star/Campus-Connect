import { useState } from 'react';
import { Link, useParams } from 'react-router';
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  Pencil,
  Plus,
  UserX,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import {
  useGetEventAttendanceQuery,
  useGetEventSummaryQuery,
  useMarkManualMutation,
  useEditAttendanceMutation,
  useDownloadAttendanceExportMutation,
} from '../services/attendanceApi.js';
import { useGetEventQuery } from '../services/eventsApi.js';
import { useGetDirectoryQuery } from '../services/peopleApi.js';
import { getErrorMessage } from '../constants/index.js';
import { exportFileName, saveBlob } from '../utils/download.js';
import { QrGenerator } from '../components/feature/attendance/QrGenerator.jsx';
import { Avatar } from '../components/ui/Avatar.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { Select } from '../components/ui/Select.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { StatCard } from '../components/ui/StatCard.jsx';
import { formatDate, formatTime } from '../utils/format.js';

const STATUS_TONE = { present: 'success', late: 'warning', absent: 'danger', registered: 'slate' };

/**
 * Organizer attendance dashboard (spec §10):
 * summary stats, QR generation, manual marking, per-record edit,
 * CSV/XLSX/PDF export.
 */
export function AttendanceManagePage() {
  useDocumentTitle('Attendance management');
  const { eventId } = useParams();

  const { data: eventData } = useGetEventQuery(eventId);
  const { data: summaryData, isLoading: summaryLoading } = useGetEventSummaryQuery(eventId);
  const { data: attendanceData, isLoading, isError, refetch } = useGetEventAttendanceQuery(eventId);
  const { data: directoryData } = useGetDirectoryQuery({ role: 'all', page: 1, limit: 100, sort: 'name' });

  const [markManual] = useMarkManualMutation();
  const [editAttendance] = useEditAttendanceMutation();

  const [manualOpen, setManualOpen] = useState(false);
  const [manualUser, setManualUser] = useState('');
  const [manualStatus, setManualStatus] = useState('present');
  const [editing, setEditing] = useState(null); // { id, status }
  const [editStatus, setEditStatus] = useState('present');

  const event = eventData?.data?.event;
  const summary = summaryData?.data;
  const records = attendanceData?.data?.items ?? [];
  const people = directoryData?.data?.items ?? [];

  const handleManualMark = async () => {
    if (!manualUser) {
      toast.error('Select a user to mark.');
      return;
    }
    try {
      await markManual({ eventId, body: { userId: manualUser, status: manualStatus } }).unwrap();
      toast.success(`Marked as ${manualStatus}`);
      setManualOpen(false);
      setManualUser('');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not mark attendance.'));
    }
  };

  const handleEdit = async () => {
    if (!editing) return;
    try {
      await editAttendance({ id: editing, eventId, status: editStatus }).unwrap();
      toast.success('Attendance updated');
      setEditing(null);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update the record.'));
    }
  };

  const [downloadExport, { isLoading: exporting }] = useDownloadAttendanceExportMutation();
  const [activeFormat, setActiveFormat] = useState(null);

  const handleExport = async (format) => {
    if (exporting) return;
    setActiveFormat(format);
    try {
      const blob = await downloadExport({ eventId, format }).unwrap();
      saveBlob(blob, exportFileName(`attendance-${eventId}`, format));
      toast.success(`Attendance exported as ${format.toUpperCase()}.`);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Export failed. Please try again.'));
    } finally {
      setActiveFormat(null);
    }
  };

  if (isError) {
    return <ErrorState title="Could not load attendance" onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" to="/events">
            <ArrowLeft className="size-4" aria-hidden="true" /> Back to events
          </Button>
          <h2 className="mt-1 flex items-center gap-2 text-xl font-bold text-slate-900">
            <ClipboardCheck className="size-5 text-primary-600" aria-hidden="true" />
            {event?.title ?? 'Attendance'}
          </h2>
          {event && (
            <p className="text-sm text-slate-500">
              {formatDate(event.date)}
              {event.startTime ? ` · ${formatTime(event.startTime)}` : ''}
            </p>
          )}
        </div>
        {event && (
          <div className="flex flex-wrap items-center gap-2">
            <QrGenerator eventId={eventId} eventTitle={event.title} />
            <Button variant="outline" onClick={() => setManualOpen(true)}>
              <Plus className="size-4" aria-hidden="true" /> Mark manually
            </Button>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" disabled={exporting} loading={activeFormat === 'csv'} onClick={() => handleExport('csv')}>
                {activeFormat !== 'csv' && 'CSV'}
              </Button>
              <Button variant="outline" size="sm" disabled={exporting} loading={activeFormat === 'xlsx'} onClick={() => handleExport('xlsx')}>
                {activeFormat !== 'xlsx' && 'Excel'}
              </Button>
              <Button variant="outline" size="sm" disabled={exporting} loading={activeFormat === 'pdf'} onClick={() => handleExport('pdf')}>
                {activeFormat !== 'pdf' && (
                  <>
                    <Download className="size-3.5" aria-hidden="true" /> PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      {summaryLoading ? (
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
      ) : summary ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total participants" value={summary.totalParticipants} icon={Users} />
          <StatCard label="Present" value={summary.counts.present + summary.counts.late} icon={CheckCircle2} />
          <StatCard label="Absent" value={summary.counts.absent} icon={UserX} />
          <StatCard label="Attendance %" value={`${summary.attendancePercent}%`} icon={Clock} />
        </div>
      ) : null}

      {/* Records table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance records</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <Skeleton className="h-24" />
            </div>
          ) : records.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={ClipboardCheck}
                title="No attendance records yet"
                description="Share the QR code for automatic check-ins, or mark attendance manually."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-5 py-3 font-semibold">Member</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Method</th>
                    <th className="px-4 py-3 font-semibold">Check-in</th>
                    <th className="px-4 py-3 font-semibold">Check-out</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {records.map((record) => (
                    <tr key={record._id} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar src={record.user?.avatar?.url} name={record.user?.name} size="sm" />
                          <div>
                            <Link to={`/profile/${record.user?._id}`} className="font-medium text-slate-900 hover:text-primary-600">
                              {record.user?.name ?? 'Unknown'}
                            </Link>
                            <p className="text-xs text-slate-400">{record.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={STATUS_TONE[record.status] ?? 'slate'}>{record.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{record.method}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {record.checkInTime ? formatTime(new Date(record.checkInTime).toTimeString().slice(0, 5)) : '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {record.checkOutTime ? formatTime(new Date(record.checkOutTime).toTimeString().slice(0, 5)) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditing(record._id);
                            setEditStatus(record.status);
                          }}
                        >
                          <Pencil className="size-3.5" aria-hidden="true" /> Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual mark modal */}
      <Modal open={manualOpen} onClose={() => setManualOpen(false)} title="Mark attendance manually" size="md">
        <div className="space-y-4">
          <Select
            label="Member"
            placeholder="Select a member"
            value={manualUser}
            onChange={(event) => setManualUser(event.target.value)}
            options={people.map((person) => ({ value: person._id, label: `${person.name} (${person.role})` }))}
          />
          <Select
            label="Status"
            value={manualStatus}
            onChange={(event) => setManualStatus(event.target.value)}
            options={[
              { value: 'present', label: 'Present' },
              { value: 'late', label: 'Late' },
              { value: 'absent', label: 'Absent' },
            ]}
          />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setManualOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleManualMark}>Mark attendance</Button>
        </div>
      </Modal>

      {/* Edit record modal */}
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Edit attendance record" size="sm">
        <Select
          label="Status"
          value={editStatus}
          onChange={(event) => setEditStatus(event.target.value)}
          options={[
            { value: 'present', label: 'Present' },
            { value: 'late', label: 'Late' },
            { value: 'absent', label: 'Absent' },
            { value: 'registered', label: 'Registered (no check-in)' },
          ]}
        />
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setEditing(null)}>
            Cancel
          </Button>
          <Button onClick={handleEdit}>Save</Button>
        </div>
      </Modal>
    </div>
  );
}
