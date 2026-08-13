import { forwardRef, useId } from 'react';
import { cn } from '../../utils/cn.js';

export const Checkbox = forwardRef(function Checkbox(
  { label, description, error, className, id, ...props },
  ref,
) {
  const autoId = useId();
  const checkboxId = id ?? autoId;

  return (
    <div className="w-full">
      <label htmlFor={checkboxId} className="flex cursor-pointer items-start gap-3">
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          className={cn(
            'mt-0.5 size-4 shrink-0 rounded border-slate-300 text-primary-600 accent-primary-600',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
            className,
          )}
          {...props}
        />
        <span className="text-sm leading-snug">
          {label && <span className="font-medium text-slate-800">{label}</span>}
          {description && <span className="block text-xs text-slate-500">{description}</span>}
        </span>
      </label>
      {error && (
        <p className="mt-1.5 pl-7 text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
