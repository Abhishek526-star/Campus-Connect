import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Search } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useClickOutside } from '../../hooks/useClickOutside.js';
import { useGlobalSearchQuery } from '../../services/searchApi.js';
import { Avatar } from '../ui/Avatar.jsx';
import { Badge } from '../ui/Badge.jsx';

/**
 * Global search bar (topbar, spec §19): type-ahead dropdown across all
 * entity types; Enter → full search page.
 */
export function GlobalSearchBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 300);
  const navigate = useNavigate();
  const location = useLocation();
  const rootRef = useRef(null);
  useClickOutside(rootRef, () => setOpen(false), open);

  const { data, isFetching } = useGlobalSearchQuery(
    { q: debounced, limit: 4 },
    { skip: debounced.trim().length < 2 },
  );

  // Close + clear when navigating (deferred to avoid cascading renders).
  useEffect(() => {
    const timer = setTimeout(() => {
      setOpen(false);
      setQuery('');
    }, 0);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const types = data?.data?.types ?? {};

  const submit = (event) => {
    event.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const groupLink = (group) => group.link ?? `/search?q=${encodeURIComponent(debounced)}`;

  return (
    <form ref={rootRef} onSubmit={submit} className="relative hidden w-72 xl:block" role="search">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search people, events, jobs…"
        aria-label="Global search"
        className="h-9 w-full rounded-full border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
      />

      {open && debounced.trim().length >= 2 && (
        <div className="absolute right-0 top-11 z-40 w-96 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="max-h-96 overflow-y-auto">
            {isFetching ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">Searching…</p>
            ) : Object.keys(types).length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">No results for “{debounced}”</p>
            ) : (
              Object.entries(types).map(([key, group]) => (
                <div key={key} className="border-b border-slate-100 last:border-0">
                  <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{group.label}</p>
                  <ul>
                    {group.items.map((item) => (
                      <li key={item._id}>
                        <button
                          type="button"
                          onClick={() => navigate(groupLink(group))}
                          className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-slate-50"
                        >
                          {item.avatar ? (
                            <Avatar src={item.avatar?.url} name={item.name} size="sm" />
                          ) : item.name ? (
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-50">
                              <span className="text-xs font-bold text-primary-700">{item.name.slice(0, 1).toUpperCase()}</span>
                            </span>
                          ) : (
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-50">
                              <span className="text-xs font-bold text-primary-700">
                                {String(item.title ?? item.company ?? '?').slice(0, 1).toUpperCase()}
                              </span>
                            </span>
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-slate-800">
                              {item.name ?? item.title ?? item.company}
                            </span>
                            <span className="block truncate text-xs text-slate-400">
                              {item.profile?.currentCompany
                                ? `${item.profile.currentCompany}${item.profile.designation ? ` · ${item.profile.designation}` : ''}`
                                : item.profile?.department
                                  ? item.profile.department
                                  : item.company
                                    ? `${item.company} · ${item.location ?? ''}`
                                    : item.type ?? item.category ?? item.fileType ?? ''}
                            </span>
                          </span>
                          {item.status && (
                            <Badge tone={item.status === 'published' || item.status === 'approved' ? 'success' : 'slate'} size="sm">
                              {item.status}
                            </Badge>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
          {!isFetching && Object.keys(types).length > 0 && (
            <button
              type="submit"
              className="block w-full border-t border-slate-100 px-4 py-2.5 text-center text-xs font-semibold text-primary-600 hover:bg-slate-50"
            >
              View all results for “{debounced}” →
            </button>
          )}
        </div>
      )}
    </form>
  );
}
