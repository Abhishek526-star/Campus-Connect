import { useEffect, useMemo, useState } from 'react';
import { Plus, Video } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useGetMeetingsQuery } from '../services/meetingsApi.js';
import { MeetingCard } from '../components/feature/meetings/MeetingCard.jsx';
import { MeetingFormModal } from '../components/feature/meetings/MeetingFormModal.jsx';
import { Button } from '../components/ui/Button.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { CardSkeleton } from '../components/ui/Skeleton.jsx';
import { Tabs } from '../components/ui/Tabs.jsx';

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

/** Meetings page (spec §8): my meetings (organizer + participant) with status tabs. */
export function MeetingsPage() {
  useDocumentTitle('Meetings');
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);

  // ?create=1 → open the schedule modal (dashboard quick action).
  useEffect(() => {
    if (searchParams.get('create') === '1') {
      const timer = setTimeout(() => {
        setFormOpen(true);
        setSearchParams({}, { replace: true });
      }, 0);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [searchParams, setSearchParams]);

  const params = useMemo(() => ({ status: tab === 'all' ? undefined : tab, page, limit: 9 }), [tab, page]);
  const { data, isLoading, isFetching, isError, refetch } = useGetMeetingsQuery(params);

  const items = data?.data?.items ?? [];
  const meta = data?.data?.meta;

  // Meetings needing my response (across pages — server returns all statuses).
  const { data: allData } = useGetMeetingsQuery({ page: 1, limit: 50 });
  const pendingCount = (allData?.data?.items ?? []).filter(
    (meeting) => meeting.myStatus === 'invited' && meeting.status === 'scheduled',
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Video className="size-5 text-primary-600" aria-hidden="true" />
            Meetings
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            One-on-one and group meetings with students, alumni, and faculty.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="size-4" aria-hidden="true" /> Schedule meeting
        </Button>
      </div>

      {pendingCount > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          You have {pendingCount} pending invitation{pendingCount > 1 ? 's' : ''} — respond to accept or decline.
        </div>
      )}

      <Tabs
        value={tab}
        onChange={(value) => {
          setTab(value);
          setPage(1);
        }}
        tabs={STATUS_TABS.map((t) => ({ ...t, count: t.value === 'pending' ? pendingCount : undefined }))}
      />

      {isError ? (
        <ErrorState title="Could not load meetings" onRetry={refetch} />
      ) : isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No meetings here"
          description="Schedule a meeting or check back once you're invited to one."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="size-4" aria-hidden="true" /> Schedule a meeting
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((meeting) => (
              <MeetingCard key={meeting._id} meeting={meeting} />
            ))}
          </div>
          <div className="flex flex-col items-center gap-2">
            {isFetching && <p className="text-xs text-slate-400">Updating…</p>}
            <Pagination page={meta?.page ?? 1} totalPages={meta?.totalPages ?? 1} onChange={setPage} />
            <p className="text-xs text-slate-400">{meta?.total ?? 0} meetings</p>
          </div>
        </>
      )}

      <MeetingFormModal open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
