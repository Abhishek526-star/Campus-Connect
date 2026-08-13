import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Search, SearchX } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { useGlobalSearchQuery } from '../services/searchApi.js';
import { Avatar } from '../components/ui/Avatar.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { SearchInput } from '../components/ui/SearchInput.jsx';
import { Select } from '../components/ui/Select.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { formatDate, timeAgo } from '../utils/format.js';
import { POST_TYPE_LABELS } from '../components/feature/community/postConstants.js';

const TYPE_OPTIONS = [
  { value: '', label: 'Everything' },
  { value: 'people', label: 'People' },
  { value: 'events', label: 'Events' },
  { value: 'meetings', label: 'Meetings' },
  { value: 'jobs', label: 'Jobs & Internships' },
  { value: 'resources', label: 'Resources' },
  { value: 'scholarships', label: 'Scholarships' },
  { value: 'posts', label: 'Posts' },
];

/**
 * Global search page (spec §19): query + type filter across all entity types,
 * with per-item links to the matching detail pages.
 */
export function SearchPage() {
  useDocumentTitle('Search');
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQ);
  const [type, setType] = useState('');
  const debounced = useDebounce(query, 350);

  const { data, isLoading, isFetching, isError, refetch } = useGlobalSearchQuery(
    { q: debounced, types: type || undefined, limit: 10 },
    { skip: debounced.trim().length < 2 },
  );

  const types = useMemo(() => data?.data?.types ?? {}, [data]);

  const resultGroups = type ? Object.entries(types).filter(([key]) => key === type) : Object.entries(types);

  const itemSecondary = (groupKey, item) => {
    if (groupKey === 'people') return item.profile?.currentCompany ? `${item.profile.currentCompany} · ${item.profile.designation ?? ''}` : item.profile?.department ?? item.role;
    if (groupKey === 'jobs') return `${item.company} · ${item.location ?? item.workMode}`;
    if (groupKey === 'events') return `${formatDate(item.date)} · ${item.mode}`;
    if (groupKey === 'meetings') return `${formatDate(item.date)} · ${item.status}`;
    if (groupKey === 'resources') return `${item.category}${item.subCategory ? ` · ${item.subCategory}` : ''}`;
    if (groupKey === 'scholarships') return `₹${Number(item.amount).toLocaleString('en-IN')} per student`;
    if (groupKey === 'posts') return `${item.author?.name ?? 'Member'} · ${timeAgo(item.createdAt)}`;
    return '';
  };

  const itemLink = (groupKey, item) => {
    if (groupKey === 'people') return `/profile/${item._id}`;
    if (groupKey === 'events') return `/events/${item._id}`;
    if (groupKey === 'meetings') return `/meetings/${item._id}`;
    if (groupKey === 'jobs') return `/opportunities/${item._id}`;
    if (groupKey === 'resources') return `/resources/${item._id}`;
    if (groupKey === 'scholarships') return `/scholarships/${item._id}`;
    if (groupKey === 'posts') return `/community`;
    return '#';
  };

  const itemTitle = (item) => item.name ?? item.title ?? item.company ?? '';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Search className="size-5 text-primary-600" aria-hidden="true" />
          Search
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">Find people, events, jobs, resources, and more.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={query}
          onChange={(value) => {
            setQuery(value);
            setSearchParams(value ? { q: value } : {}, { replace: true });
          }}
          placeholder="Search the campus community…"
          className="flex-1"
          autoFocus
        />
        <Select
          aria-label="Search scope"
          value={type}
          onChange={(event) => setType(event.target.value)}
          options={TYPE_OPTIONS}
          className="sm:w-52"
        />
      </div>

      {isError ? (
        <ErrorState title="Search failed" onRetry={refetch} />
      ) : debounced.trim().length < 2 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-slate-400">
            Type at least 2 characters to search across the community.
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : resultGroups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <SearchX className="size-8 text-slate-300" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-700">No results for “{debounced}”</p>
            <p className="text-xs text-slate-400">Try different keywords or broaden the search scope.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {resultGroups.map(([key, group]) => (
            <div key={key}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">{group.label}</h3>
                {group.link && (
                  <Link to={group.link} className="text-xs font-semibold text-primary-600 hover:text-primary-700">
                    View all →
                  </Link>
                )}
              </div>
              <Card>
                <CardContent className="p-2">
                  <ul className="divide-y divide-slate-50">
                    {group.items.map((item) => (
                      <li key={item._id}>
                        <Link to={itemLink(key, item)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50">
                          {key === 'people' ? (
                            <Avatar src={item.avatar?.url} name={item.name} size="md" />
                          ) : (
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-50">
                              <span className="text-sm font-bold text-primary-700">{itemTitle(item).slice(0, 1).toUpperCase()}</span>
                            </span>
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-slate-900">{itemTitle(item)}</span>
                            <span className="block truncate text-xs text-slate-500">{itemSecondary(key, item)}</span>
                            {key === 'posts' && item.content && (
                              <span className="mt-0.5 line-clamp-1 block text-xs text-slate-400">{item.content}</span>
                            )}
                          </span>
                          {key === 'posts' && <Badge tone="primary" size="sm">{POST_TYPE_LABELS[item.type] ?? item.type}</Badge>}
                          {key === 'resources' && <Badge tone="accent" size="sm">{item.avgRating?.toFixed(1) ?? 'New'} ★</Badge>}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          ))}
          {isFetching && <p className="text-center text-xs text-slate-400">Updating…</p>}
        </div>
      )}
    </div>
  );
}
