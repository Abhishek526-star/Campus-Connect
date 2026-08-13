import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Briefcase, FileText, MessageCircleQuestion } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useGetResourcesQuery } from '../services/resourcesApi.js';
import { ResourceCard } from '../components/feature/resources/ResourceCard.jsx';
import { SearchInput } from '../components/ui/SearchInput.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { CardSkeleton } from '../components/ui/Skeleton.jsx';
import { RESOURCE_SUB_CATEGORIES } from '../constants/index.js';

const PLACEMENT_SUBS = RESOURCE_SUB_CATEGORIES['Placement Preparation'];

/**
 * Placement Prep hub (spec §29): DSA, aptitude, reasoning, verbal, coding,
 * interview prep, and HR questions — powered by the Placement Preparation
 * resource category + a company-wise interview Q&A guide.
 */
export function PlacementPrepPage() {
  useDocumentTitle('Placement preparation');
  const [subCategory, setSubCategory] = useState('');
  const [search, setSearch] = useState('');

  const params = useMemo(
    () => ({
      category: 'Placement Preparation',
      subCategory: subCategory || undefined,
      search: search || undefined,
      sort: 'rating',
      page: 1,
      limit: 12,
    }),
    [subCategory, search],
  );

  const { data, isLoading, isError, refetch } = useGetResourcesQuery(params);
  const items = data?.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Briefcase className="size-5 text-amber-500" aria-hidden="true" />
          Placement Preparation
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Everything you need for placement season — DSA, aptitude, coding, and interviews.
        </p>
      </div>

      {/* Quick guide card */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
          <MessageCircleQuestion className="size-8 shrink-0 text-amber-500" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-800">Company-wise interview questions</p>
            <p className="text-xs text-slate-500">
              Community-curated question banks — search "Amazon", "Google", or "Microsoft" in the resources below,
              or share your own interview experience as a community post.
            </p>
          </div>
          <Link to="/community" className="shrink-0 text-sm font-semibold text-primary-600 hover:text-primary-700">
            Share your experience →
          </Link>
        </CardContent>
      </Card>

      {/* Sub-category chips */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSubCategory('')}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${!subCategory ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}
        >
          All
        </button>
        {PLACEMENT_SUBS.map((sub) => (
          <button
            key={sub}
            type="button"
            onClick={() => setSubCategory(sub)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${subCategory === sub ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}
          >
            {sub}
          </button>
        ))}
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Search interview questions, topics…" className="max-w-md" />

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No placement resources yet"
          description="Faculty and alumni upload placement materials — check back soon."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((resource) => (
            <ResourceCard key={resource._id} resource={resource} />
          ))}
        </div>
      )}

      <p className="flex items-center gap-2 text-xs text-slate-400">
        <Badge tone="slate" size="sm">Tip</Badge>
        New resources appear after admin approval.
      </p>
    </div>
  );
}
