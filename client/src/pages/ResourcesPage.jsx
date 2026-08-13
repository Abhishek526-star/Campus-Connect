import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Plus } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useGetResourcesQuery, useGetBookmarkedResourcesQuery } from '../services/resourcesApi.js';
import { ResourceCard } from '../components/feature/resources/ResourceCard.jsx';
import { UploadResourceModal } from '../components/feature/resources/UploadResourceModal.jsx';
import { SearchInput } from '../components/ui/SearchInput.jsx';
import { Select } from '../components/ui/Select.jsx';
import { Tabs } from '../components/ui/Tabs.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { CardSkeleton } from '../components/ui/Skeleton.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { RESOURCE_CATEGORIES, RESOURCE_SUB_CATEGORIES } from '../constants/index.js';

const CAN_UPLOAD = ['faculty', 'alumni', 'admin'];

/**
 * Study resources library (spec §15): category tabs (GATE / Semester /
 * Placement / Development / Other), search, filters, upload, bookmarks.
 */
export function ResourcesPage() {
  useDocumentTitle('Study resources');
  const role = useSelector((state) => state.auth.user?.role);
  const canUpload = CAN_UPLOAD.includes(role);
  const [searchParams, setSearchParams] = useSearchParams();

  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  // ?upload=1 → open the upload modal (dashboard quick action).
  useEffect(() => {
    if (searchParams.get('upload') === '1') {
      const timer = setTimeout(() => {
        setUploadOpen(true);
        setSearchParams({}, { replace: true });
      }, 0);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [searchParams, setSearchParams]);

  const params = useMemo(
    () => ({
      category: tab === 'all' ? undefined : tab,
      subCategory: subCategory || undefined,
      search: search || undefined,
      sort,
      page,
      limit: 9,
    }),
    [tab, subCategory, search, sort, page],
  );

  const { data, isLoading, isFetching, isError, refetch } = useGetResourcesQuery(params, { skip: showBookmarks });
  const { data: bookmarksData, isLoading: bookmarksLoading } = useGetBookmarkedResourcesQuery(undefined, { skip: !showBookmarks });

  const items = showBookmarks ? (bookmarksData?.data?.items ?? []) : (data?.data?.items ?? []);
  const meta = data?.data?.meta;
  const loading = showBookmarks ? bookmarksLoading : isLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <BookOpen className="size-5 text-primary-600" aria-hidden="true" />
            Study Resources
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            GATE, semester notes, placement prep, and development resources.
          </p>
        </div>
        {canUpload && (
          <Button onClick={() => setUploadOpen(true)}>
            <Plus className="size-4" aria-hidden="true" /> Upload resource
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          value={showBookmarks ? 'bookmarks' : tab}
          onChange={(value) => {
            setShowBookmarks(value === 'bookmarks');
            if (value !== 'bookmarks') setTab(value);
            setPage(1);
          }}
          tabs={[
            { value: 'all', label: 'All' },
            ...RESOURCE_CATEGORIES.map((category) => ({ value: category, label: category })),
            { value: 'bookmarks', label: 'Bookmarks' },
          ]}
        />
        <div className="flex gap-2">
          <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search resources…" className="w-52" />
          <Select
            aria-label="Sort"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            options={[
              { value: 'newest', label: 'Newest' },
              { value: 'rating', label: 'Top rated' },
              { value: 'downloads', label: 'Most downloaded' },
            ]}
            className="w-36"
          />
        </div>
      </div>

      {!showBookmarks && tab !== 'all' && (RESOURCE_SUB_CATEGORIES[tab]?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSubCategory('')}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${!subCategory ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}
          >
            All
          </button>
          {RESOURCE_SUB_CATEGORIES[tab].map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => { setSubCategory(sub); setPage(1); }}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${subCategory === sub ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      {isError ? (
        <ErrorState title="Could not load resources" onRetry={refetch} />
      ) : loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={showBookmarks ? 'No bookmarked resources' : 'No resources found'}
          description={showBookmarks ? 'Bookmark resources you want to revisit.' : 'Try adjusting the search or filters.'}
        />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((resource) => (
              <ResourceCard key={resource._id} resource={resource} />
            ))}
          </div>
          {!showBookmarks && (
            <div className="flex flex-col items-center gap-2">
              {isFetching && <p className="text-xs text-slate-400">Updating…</p>}
              <Pagination page={meta?.page ?? 1} totalPages={meta?.totalPages ?? 1} onChange={setPage} />
              <p className="text-xs text-slate-400">{meta?.total ?? 0} resources</p>
            </div>
          )}
        </>
      )}

      <UploadResourceModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
