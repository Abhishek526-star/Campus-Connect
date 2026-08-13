import { forwardRef, useId } from 'react';
import { cn } from '../../utils/cn.js';

/**
 * Text input with label, error, hint, and optional leading icon.
 * Error state is wired to aria-invalid + aria-describedby for screen readers.
 */
export const Input = forwardRef(function Input(
  { label, error, hint, required, leftIcon: LeftIcon, className, id, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative">
        {LeftIcon && (
          <LeftIcon
            className="pointer-events-none absolute left-3 top-1/2 size-4.5 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={cn(
            'h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 shadow-sm transition-colors',
            'placeholder:text-slate-400',
            'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25',
            'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
            LeftIcon && 'pl-10',
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500/25'
              : 'border-slate-300',
            className,
          )}
          {...props}
        />
      </div>
      {error ? (
        <p id={errorId} className="mt-1.5 text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1.5 text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
