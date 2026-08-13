import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { CalendarDays, Plus } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useGetEventsQuery, useGetMyEventsQuery } from '../services/eventsApi.js';
import { EventCard } from '../components/feature/events/EventCard.jsx';
import { EventFormModal } from '../components/feature/events/EventFormModal.jsx';
import { SearchInput } from '../components/ui/SearchInput.jsx';
import { Select } from '../components/ui/Select.jsx';
import { Tabs } from '../components/ui/Tabs.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { CardSkeleton } from '../components/ui/Skeleton.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { formatDate, formatTime } from '../utils/format.js';
import { EVENT_CATEGORIES, EVENT_CATEGORY_LABELS, DEPARTMENTS, EVENT_STATUS_LABELS } from '../constants/index.js';

const CAN_ORGANIZE = ['faculty', 'alumni', 'admin'];

const PERIOD_TABS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'all', label: 'All' },
];

/**
 * Events page (spec §9): browse with search/filters, upcoming/past tabs,
 * organizer view (my events) and create/edit modal.
 */
export function EventsPage() {
  useDocumentTitle('Events');
  const [searchParams, setSearchParams] = useSearchParams();
  const role = useSelector((state) => state.auth.user?.role);
  const canOrganize = CAN_ORGANIZE.includes(role);

  const [period, setPeriod] = useState('upcoming');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [department, setDepartment] = useState('');
  const [mode, setMode] = useState('');
  const [page, setPage] = useState(1);
  const [showMine, setShowMine] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  // ?create=1 → open the create modal (from dashboard quick action).
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

  const params = useMemo(
    () => ({
      search: search || undefined,
      category: category || undefined,
      department: department || undefined,
      mode: mode || undefined,
      period: period === 'all' ? undefined : period,
      page,
      limit: 9,
    }),
    [search, category, department, mode, period, page],
  );

  const { data, isLoading, isFetching, isError, refetch } = useGetEventsQuery(params, { skip: showMine });
  const { data: mineData, isLoading: mineLoading } = useGetMyEventsQuery(undefined, { skip: !showMine });

  const items = showMine ? (mineData?.data?.items ?? []) : (data?.data?.items ?? []);
  const meta = data?.data?.meta;
  const loading = showMine ? mineLoading : isLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <CalendarDays className="size-5 text-primary-600" aria-hidden="true" />
            Events
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Workshops, hackathons, alumni meets, webinars, and more.
          </p>
        </div>
        {canOrganize && (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="size-4" aria-hidden="true" /> Create event
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={showMine ? 'mine' : period}
          onChange={(value) => {
            if (value === 'mine') setShowMine(true);
            else {
              setShowMine(false);
              setPeriod(value);
            }
            setPage(1);
          }}
          tabs={[
            ...PERIOD_TABS,
            ...(canOrganize ? [{ value: 'mine', label: 'My events' }] : []),
          ]}
        />
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search events…"
          className="sm:max-w-xs"
        />
      </div>

      {/* Filters */}
      {!showMine && (
        <Card>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <Select
              label="Category"
              placeholder="All categories"
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setPage(1);
              }}
              options={EVENT_CATEGORIES.map((c) => ({ value: c, label: EVENT_CATEGORY_LABELS[c] ?? c }))}
            />
            <Select
              label="Department"
              placeholder="All departments"
              value={department}
              onChange={(event) => {
                setDepartment(event.target.value);
                setPage(1);
              }}
              options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
            />
            <Select
              label="Mode"
              placeholder="All modes"
              value={mode}
              onChange={(event) => {
                setMode(event.target.value);
                setPage(1);
              }}
              options={[
                { value: 'online', label: 'Online' },
                { value: 'offline', label: 'Offline' },
                { value: 'hybrid', label: 'Hybrid' },
              ]}
            />
          </CardContent>
        </Card>
      )}

      {/* My events table */}
      {showMine ? (
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-3 p-4">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : items.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={CalendarDays}
                  title="You haven't organized any events yet"
                  description="Create your first event — students will register and check in with QR codes."
                  action={
                    <Button onClick={() => setFormOpen(true)}>
                      <Plus className="size-4" aria-hidden="true" /> Create event
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-5 py-3 font-semibold">Event</th>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Time</th>
                      <th className="px-4 py-3 font-semibold">Venue</th>
                      <th className="px-4 py-3 font-semibold">Registrations</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {items.map((event) => (
                      <tr key={event._id} className="transition-colors hover:bg-slate-50/70">
                        <td className="px-5 py-3">
                          <a href={`/events/${event._id}`} className="font-medium text-slate-900 hover:text-primary-700">
                            {event.title}
                          </a>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(event.date)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          {event.startTime ? formatTime(event.startTime) : '—'}
                        </td>
                        <td className="max-w-40 truncate px-4 py-3 text-slate-500">{event.venue || '—'}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          {event.registrationsCount}/{event.maxParticipants}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            tone={
                              event.status === 'published'
                                ? 'success'
                                : event.status === 'cancelled'
                                  ? 'danger'
                                  : event.status === 'completed'
                                    ? 'slate'
                                    : 'warning'
                            }
                            size="sm"
                          >
                            {EVENT_STATUS_LABELS[event.status] ?? event.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : isError ? (
        <ErrorState title="Could not load events" onRetry={refetch} />
      ) : loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No events found"
          description="Try changing the filters, or check back soon — new events are added regularly."
        />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
          <div className="flex flex-col items-center gap-2">
            {isFetching && <p className="text-xs text-slate-400">Updating…</p>}
            <Pagination page={meta?.page ?? 1} totalPages={meta?.totalPages ?? 1} onChange={setPage} />
            <p className="text-xs text-slate-400">{meta?.total ?? 0} events</p>
          </div>
        </>
      )}

      <EventFormModal open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
