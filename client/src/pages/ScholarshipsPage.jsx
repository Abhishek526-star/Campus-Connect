import { useMemo, useState } from 'react';
import { GraduationCap, Plus } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useGetScholarshipsQuery } from '../services/scholarshipsApi.js';
import { ScholarshipCard } from '../components/feature/scholarships/ScholarshipCard.jsx';
import { CreateScholarshipModal } from '../components/feature/scholarships/CreateScholarshipModal.jsx';
import { SearchInput } from '../components/ui/SearchInput.jsx';
import { Select } from '../components/ui/Select.jsx';
import { Tabs } from '../components/ui/Tabs.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { CardSkeleton } from '../components/ui/Skeleton.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { SCHOLARSHIP_CATEGORY_LABELS } from './scholarshipConstants.js';

const CAN_SPONSOR = ['faculty', 'alumni', 'admin'];

/** Scholarships page (spec §11): browse campaigns with funding progress. */
export function ScholarshipsPage() {
  useDocumentTitle('Scholarships');
  const role = useSelector((state) => state.auth.user?.role);
  const canSponsor = CAN_SPONSOR.includes(role);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [tab, setTab] = useState('active');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  const params = useMemo(
    () => ({
      search: search || undefined,
      category: category || undefined,
      status: tab === 'all' ? undefined : tab,
      page,
      limit: 9,
    }),
    [search, category, tab, page],
  );

  const { data, isLoading, isFetching, isError, refetch } = useGetScholarshipsQuery(params);
  const items = data?.data?.items ?? [];
  const meta = data?.data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <GraduationCap className="size-5 text-accent-600" aria-hidden="true" />
            Scholarships
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Alumni and faculty-funded support for deserving students.
          </p>
        </div>
        {canSponsor && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" aria-hidden="true" /> Create campaign
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={tab}
          onChange={(value) => {
            setTab(value);
            setPage(1);
          }}
          tabs={[
            { value: 'active', label: 'Active' },
            { value: 'all', label: 'All' },
          ]}
        />
        <div className="flex gap-3">
          <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search campaigns…" className="sm:w-56" />
          <Select
            aria-label="Filter by category"
            value={category}
            onChange={(event) => { setCategory(event.target.value); setPage(1); }}
            options={[
              { value: '', label: 'All categories' },
              ...Object.entries(SCHOLARSHIP_CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
            ]}
            className="sm:w-44"
          />
        </div>
      </div>

      {isError ? (
        <ErrorState title="Could not load scholarships" onRetry={refetch} />
      ) : isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No scholarships found"
          description="Alumni-funded campaigns appear here as they launch."
        />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((scholarship) => (
              <ScholarshipCard key={scholarship._id} scholarship={scholarship} />
            ))}
          </div>
          <div className="flex flex-col items-center gap-2">
            {isFetching && <p className="text-xs text-slate-400">Updating…</p>}
            <Pagination page={meta?.page ?? 1} totalPages={meta?.totalPages ?? 1} onChange={setPage} />
            <p className="text-xs text-slate-400">{meta?.total ?? 0} campaigns</p>
          </div>
        </>
      )}

      <CreateScholarshipModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
