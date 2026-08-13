import { useMemo, useState } from 'react';
import { Globe } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useGetPostsQuery } from '../services/postsApi.js';
import { PostCard } from '../components/feature/community/PostCard.jsx';
import { PostComposer } from '../components/feature/community/PostComposer.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { CardSkeleton } from '../components/ui/Skeleton.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Select } from '../components/ui/Select.jsx';
import { POST_TYPE_OPTIONS } from '../components/feature/community/postConstants.js';

/**
 * Community feed (spec §16): composer + feed with type filter, sort, pagination.
 */
export function CommunityPage() {
  useDocumentTitle('Community');
  const [type, setType] = useState('all');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({ type: type === 'all' ? undefined : type, sort, page, limit: 10 }),
    [type, sort, page],
  );
  const { data, isLoading, isFetching, isError, refetch } = useGetPostsQuery(params);

  const items = data?.data?.items ?? [];
  const meta = data?.data?.meta;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Globe className="size-5 text-primary-600" aria-hidden="true" />
            Community
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Knowledge, achievements, advice, and experiences from the campus family.
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            aria-label="Filter by type"
            value={type}
            onChange={(event) => { setType(event.target.value); setPage(1); }}
            options={[{ value: 'all', label: 'All types' }, ...POST_TYPE_OPTIONS]}
            className="w-44"
          />
          <Select
            aria-label="Sort"
            value={sort}
            onChange={(event) => { setSort(event.target.value); setPage(1); }}
            options={[
              { value: 'newest', label: 'Newest' },
              { value: 'top', label: 'Top liked' },
            ]}
            className="w-32"
          />
        </div>
      </div>

      <PostComposer />

      {isError ? (
        <ErrorState title="Could not load the feed" onRetry={refetch} />
      ) : isLoading ? (
        <div className="space-y-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="No posts yet"
          description="Be the first to share something with the community!"
        />
      ) : (
        <div className="space-y-5">
          {items.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
          <div className="flex flex-col items-center gap-2">
            {isFetching && <p className="text-xs text-slate-400">Updating…</p>}
            <Pagination page={meta?.page ?? 1} totalPages={meta?.totalPages ?? 1} onChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}
