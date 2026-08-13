import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Filter, Inbox, UserPlus, Users } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { useGetDirectoryQuery, useGetConnectionRequestsQuery } from '../services/peopleApi.js';
import { UserCard } from '../components/feature/people/UserCard.jsx';
import { PeopleFilters } from '../components/feature/people/PeopleFilters.jsx';
import { SearchInput } from '../components/ui/SearchInput.jsx';
import { Tabs } from '../components/ui/Tabs.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { CardSkeleton } from '../components/ui/Skeleton.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';

const TABS = [
  { value: 'all', label: 'Everyone' },
  { value: 'student', label: 'Students' },
  { value: 'alumni', label: 'Alumni' },
  { value: 'faculty', label: 'Faculty' },
];

const DEFAULT_FILTERS = {
  department: '',
  graduationYear: '',
  company: '',
  industry: '',
  location: '',
  designation: '',
  skills: '',
};

/**
 * People directory (spec §6) — search, role tabs, filters, pagination,
 * connection lifecycle buttons, and a pending-requests banner.
 */
export function PeoplePage() {
  useDocumentTitle('People');
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(() => {
    const initial = searchParams.get('tab');
    return ['student', 'alumni', 'faculty', 'all'].includes(initial) ? initial : 'all';
  });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const params = useMemo(() => {
    const p = {
      role: tab,
      search: debouncedSearch || undefined,
      sort: 'name',
      page,
      limit: 12,
    };
    for (const [key, value] of Object.entries(filters)) {
      if (value) p[key] = value;
    }
    return p;
  }, [tab, debouncedSearch, filters, page]);

  const { data, isLoading, isFetching, isError, refetch } = useGetDirectoryQuery(params);
  const { data: requestsData } = useGetConnectionRequestsQuery();

  const items = data?.data?.items ?? [];
  const meta = data?.data?.meta;
  const requestCount = requestsData?.data?.items?.length ?? 0;
  const activeFilters = Object.values(filters).filter(Boolean).length;

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">People</h2>
          <p className="text-sm text-slate-500">Find students, alumni, and faculty across the campus community.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/connections/requests"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-primary-300 hover:text-primary-700"
          >
            <UserPlus className="size-4 text-primary-600" aria-hidden="true" />
            Requests
            {requestCount > 0 && (
              <Badge tone="danger" size="sm">{requestCount}</Badge>
            )}
          </Link>
        </div>
      </div>

      {/* Pending requests banner */}
      {requestCount > 0 && (
        <Link to="/connections/requests" className="block">
          <div className="flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3">
            <Inbox className="size-5 text-primary-600" aria-hidden="true" />
            <p className="text-sm font-medium text-primary-800">
              You have {requestCount} incoming connection request{requestCount > 1 ? 's' : ''} — review them now.
            </p>
          </div>
        </Link>
      )}

      {/* Search + filters */}
      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Search by name…"
              className="sm:max-w-sm"
            />
            <button
              type="button"
              onClick={() => setShowFilters((value) => !value)}
              className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 sm:self-auto"
            >
              <Filter className="size-4" aria-hidden="true" />
              Filters
              {activeFilters > 0 && <Badge tone="primary" size="sm">{activeFilters}</Badge>}
            </button>
          </div>
          {showFilters && (
            <PeopleFilters
              filters={filters}
              onChange={(next) => {
                setFilters(next);
                setPage(1);
              }}
              onReset={resetFilters}
            />
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(value) => {
          setTab(value);
          setPage(1);
        }}
        tabs={TABS}
      />

      {/* Grid */}
      {isError ? (
        <ErrorState title="Could not load the directory" onRetry={refetch} />
      ) : isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No people found"
          description="Try adjusting the search or clearing some filters."
          action={
            <button type="button" onClick={resetFilters} className="text-sm font-semibold text-primary-600 hover:underline">
              Clear all filters
            </button>
          }
        />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((user) => (
              <UserCard key={user._id} user={user} />
            ))}
          </div>
          <div className="flex flex-col items-center gap-2">
            {isFetching && <p className="text-xs text-slate-400">Updating…</p>}
            <Pagination page={meta?.page ?? 1} totalPages={meta?.totalPages ?? 1} onChange={setPage} />
            <p className="text-xs text-slate-400">{meta?.total ?? 0} people</p>
          </div>
        </div>
      )}
    </div>
  );
}
