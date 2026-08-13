import { GraduationCap } from 'lucide-react';
import { cn } from '../../utils/cn.js';

/** Campus Connect brand mark + wordmark. */
export function AppLogo({ compact = false, className }) {
  const content = (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary-600 shadow-sm">
        <GraduationCap className="size-5 text-white" aria-hidden="true" />
      </span>
      {!compact && (
        <span className="text-lg font-bold tracking-tight text-slate-900">
          Campus<span className="text-primary-600">Connect</span>
        </span>
      )}
    </span>
  );

  return content;
}
