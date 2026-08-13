import { X } from 'lucide-react';
import { cn } from '../../utils/cn.js';

const TONES = {
  slate: 'bg-slate-100 text-slate-700',
  primary: 'bg-primary-50 text-primary-700',
  accent: 'bg-accent-50 text-accent-700',
  warning: 'bg-amber-50 text-amber-700',
};

/** Small removable chip (skills, tags, filters). */
export function Tag({ children, tone = 'slate', onRemove, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        TONES[tone],
        className,
      )}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${children}`}
          className="rounded-full p-0.5 hover:bg-black/5"
        >
          <X className="size-3" aria-hidden="true" />
        </button>
      )}
    </span>
  );
}
