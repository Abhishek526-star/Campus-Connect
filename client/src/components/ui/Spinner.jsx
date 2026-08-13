import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn.js';

/** Inline loading spinner. */
export function Spinner({ size = 'md', className, label = 'Loading…' }) {
  const sizes = { sm: 'size-4', md: 'size-6', lg: 'size-8' };
  return (
    <span role="status" className={cn('inline-flex items-center justify-center gap-2', className)}>
      <Loader2 className={cn('animate-spin text-primary-600', sizes[size])} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Centered full-region loader. */
export function PageLoader({ label = 'Loading…', className }) {
  return (
    <div role="status" className={cn('flex min-h-[40vh] flex-col items-center justify-center gap-3', className)}>
      <Spinner size="lg" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}
