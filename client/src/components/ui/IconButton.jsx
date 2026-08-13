import { forwardRef } from 'react';
import { cn } from '../../utils/cn.js';

const VARIANTS = {
  default: 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
  primary: 'text-primary-600 hover:bg-primary-50',
  danger: 'text-red-600 hover:bg-red-50',
};

const SIZES = {
  sm: 'size-8 rounded-lg [&>svg]:size-4',
  md: 'size-9 rounded-lg [&>svg]:size-4.5',
  lg: 'size-11 rounded-xl [&>svg]:size-5',
};

/** Square icon-only button with accessible label. */
export const IconButton = forwardRef(function IconButton(
  { variant = 'default', size = 'md', label, className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center transition-colors',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
        'disabled:pointer-events-none disabled:opacity-60',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
