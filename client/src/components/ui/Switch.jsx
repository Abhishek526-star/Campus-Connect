import { useId } from 'react';
import { cn } from '../../utils/cn.js';

const SIZES = { sm: 'h-5 w-9', md: 'h-6 w-11' };
const KNOB = { sm: 'size-4', md: 'size-5' };

/** Accessible toggle switch. */
export function Switch({ label, checked, onChange, disabled, size = 'md', className, ...props }) {
  const id = useId();

  return (
    <label htmlFor={id} className={cn('inline-flex cursor-pointer items-center gap-3', disabled && 'opacity-60', className)}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          'relative inline-flex shrink-0 items-center rounded-full transition-colors',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
          checked ? 'bg-primary-600' : 'bg-slate-300',
          SIZES[size],
        )}
        {...props}
      >
        <span
          className={cn(
            'inline-block transform rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-[calc(100%+2px)]' : 'translate-x-0.5',
            KNOB[size],
          )}
        />
      </button>
      {label && <span className="text-sm font-medium text-slate-700">{label}</span>}
    </label>
  );
}
