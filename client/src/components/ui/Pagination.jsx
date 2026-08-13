import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn.js';

/**
 * Server-side pagination controls. `page` is 1-based; `totalPages` from API meta.
 */
export function Pagination({ page, totalPages, onChange, className }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i += 1) pages.push(i);

  const buttonClass = (active) =>
    cn(
      'inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors',
      active
        ? 'bg-primary-600 text-white'
        : 'text-slate-600 hover:bg-slate-100',
    );

  return (
    <nav className={cn('flex items-center justify-center gap-1', className)} aria-label="Pagination">
      <button
        type="button"
        className={buttonClass(false)}
        onClick={() => onChange?.(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
      </button>

      {start > 1 && (
        <>
          <button type="button" className={buttonClass(false)} onClick={() => onChange?.(1)}>
            1
          </button>
          {start > 2 && <span className="px-1 text-slate-400">…</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className={buttonClass(p === page)}
          onClick={() => onChange?.(p)}
          aria-current={p === page ? 'page' : undefined}
        >
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-slate-400">…</span>}
          <button type="button" className={buttonClass(false)} onClick={() => onChange?.(totalPages)}>
            {totalPages}
          </button>
        </>
      )}

      <button
        type="button"
        className={buttonClass(false)}
        onClick={() => onChange?.(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        <ChevronRight className="size-4" aria-hidden="true" />
      </button>
    </nav>
  );
}
