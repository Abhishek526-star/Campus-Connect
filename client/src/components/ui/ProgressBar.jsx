import { cn } from '../../utils/cn.js';

const TONES = {
  primary: 'bg-primary-600',
  accent: 'bg-accent-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  slate: 'bg-slate-400',
};

/** Progress bar; `value` 0–100. */
export function ProgressBar({ value = 0, tone = 'primary', className, showLabel = false }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-500', TONES[tone])}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && <span className="text-xs font-semibold text-slate-600">{Math.round(clamped)}%</span>}
    </div>
  );
}
