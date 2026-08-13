import { useEffect, useMemo, useState } from 'react';
import { Briefcase, Plus } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useGetJobsQuery, useGetSavedJobsQuery } from '../services/jobsApi.js';
import { JobCard } from '../components/feature/jobs/JobCard.jsx';
import { JobFormModal } from '../components/feature/jobs/JobFormModal.jsx';
import { SearchInput } from '../components/ui/SearchInput.jsx';
import { Select } from '../components/ui/Select.jsx';
import { Tabs } from '../components/ui/Tabs.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { CardSkeleton } from '../components/ui/Skeleton.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { Input } from '../components/ui/Input.jsx';

const CAN_POST = ['faculty', 'alumni', 'admin'];

const TYPE_TABS = [
  { value: 'all', label: 'All' },
  { value: 'job', label: 'Jobs' },
  { value: 'internship', label: 'Internships' },
  { value: 'hackathon', label: 'Hackathons' },
  { value: 'freelance', label: 'Freelance' },
];

/**
 * Jobs & Internships portal (spec §14): browse with filters, post, saved tab.
 */
export function OpportunitiesPage() {
  useDocumentTitle('Opportunities');
  const role = useSelector((state) => state.auth.user?.role);
  const canPost = CAN_POST.includes(role);
  const [searchParams, setSearchParams] = useSearchParams();

  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [location, setLocation] = useState('');
  const [showSaved, setShowSaved] = useState(false);
  const [showMine, setShowMine] = useState(false);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);

  // ?create=1 → open the post modal (dashboard quick action).
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
      type: tab === 'all' ? undefined : tab,
      search: search || undefined,
      workMode: workMode || undefined,
      location: location || undefined,
      page,
      limit: 9,
      sort: 'featured',
      ...(showMine ? { includeAll: 'true', postedByMe: 'true' } : {}),
    }),
    [tab, search, workMode, location, page, showMine],
  );

  const { data, isLoading, isFetching, isError, refetch } = useGetJobsQuery(params, { skip: showSaved });
  const items = showSaved ? [] : (data?.data?.items ?? []);
  const meta = data?.data?.meta;

  const { data: savedData, isLoading: savedLoading } = useGetSavedJobsQuery(undefined, { skip: !showSaved });
  const savedItems = savedData?.data?.items ?? [];

  const loading = showSaved ? savedLoading : isLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Briefcase className="size-5 text-primary-600" aria-hidden="true" />
            Jobs & Internships
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Opportunities posted by alumni, faculty, and the community.
          </p>
        </div>
        {canPost && (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="size-4" aria-hidden="true" /> Post opportunity
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          value={showSaved ? 'saved' : showMine ? 'mine' : tab}
          onChange={(value) => {
            setShowSaved(value === 'saved');
            setShowMine(value === 'mine');
            if (value !== 'saved' && value !== 'mine') setTab(value);
            setPage(1);
          }}
          tabs={[
            ...TYPE_TABS,
            ...(canPost ? [{ value: 'mine', label: 'My posts' }] : []),
            { value: 'saved', label: 'Saved' },
          ]}
        />
        <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search jobs, companies…" className="lg:w-64" />
      </div>

      {!showSaved && !showMine && (
        <Card>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Work mode"
              placeholder="All modes"
              value={workMode}
              onChange={(event) => { setWorkMode(event.target.value); setPage(1); }}
              options={[
                { value: 'remote', label: 'Remote' },
                { value: 'hybrid', label: 'Hybrid' },
                { value: 'onsite', label: 'On-site' },
              ]}
            />
            <Input
              label="Location"
              placeholder="e.g. Bengaluru"
              value={location}
              onChange={(event) => { setLocation(event.target.value); setPage(1); }}
            />
          </CardContent>
        </Card>
      )}

      {isError ? (
        <ErrorState title="Could not load opportunities" onRetry={refetch} />
      ) : loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : (showSaved ? savedItems : items).length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={showSaved ? 'No saved opportunities' : showMine ? "You haven't posted anything yet" : 'No opportunities found'}
          description={
            showSaved
              ? 'Save opportunities you are interested in to see them here.'
              : showMine
                ? 'Post your first opportunity — jobs, internships, hackathons, and more.'
                : 'Try adjusting the filters.'
          }
          action={
            showMine && canPost ? (
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="size-4" aria-hidden="true" /> Post opportunity
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {(showSaved ? savedItems : items).map((job) => (
              <JobCard key={job._id} job={job} />
            ))}
          </div>
          {!showSaved && (
            <div className="flex flex-col items-center gap-2">
              {isFetching && <p className="text-xs text-slate-400">Updating…</p>}
              <Pagination page={meta?.page ?? 1} totalPages={meta?.totalPages ?? 1} onChange={setPage} />
              <p className="text-xs text-slate-400">{meta?.total ?? 0} opportunities</p>
            </div>
          )}
        </>
      )}

      <JobFormModal open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
