import { cn } from '../../utils/cn.js';

const TONES = {
  slate: 'bg-slate-100 text-slate-700',
  primary: 'bg-primary-50 text-primary-700',
  accent: 'bg-accent-50 text-accent-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
  violet: 'bg-violet-50 text-violet-700',
  outline: 'border border-slate-300 text-slate-600',
};

const SIZES = { sm: 'px-2 py-0.5 text-[11px]', md: 'px-2.5 py-0.5 text-xs' };

/** Small status/label pill. */
export function Badge({ tone = 'slate', size = 'md', className, children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap',
        TONES[tone],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
