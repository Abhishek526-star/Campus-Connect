import { forwardRef } from 'react';
import { Link } from 'react-router';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn.js';

const VARIANTS = {
  primary: 'bg-primary-600 text-white shadow-sm hover:bg-primary-700 focus-visible:outline-primary-600',
  secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 focus-visible:outline-slate-400',
  outline: 'border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-slate-400',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-slate-400',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:outline-red-600',
  success: 'bg-accent-600 text-white shadow-sm hover:bg-accent-700 focus-visible:outline-accent-600',
};

const SIZES = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

/**
 * Primary action button. Renders:
 * - react-router Link when `to` is provided
 * - a plain anchor when `href` is provided (e.g. in-page anchors)
 * - a native button otherwise
 * Supports a loading state that disables the control and shows a spinner.
 */
export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, className, children, to, href, ...props },
  ref,
) {
  const classes = cn(
    'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
    'disabled:pointer-events-none disabled:opacity-60',
    VARIANTS[variant],
    SIZES[size],
    className,
  );

  const content = (
    <>
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </>
  );

  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a ref={ref} href={href} className={classes} {...props}>
        {content}
      </a>
    );
  }

  return (
    <button ref={ref} type={props.type ?? 'button'} disabled={disabled || loading} className={classes} {...props}>
      {content}
    </button>
  );
});
