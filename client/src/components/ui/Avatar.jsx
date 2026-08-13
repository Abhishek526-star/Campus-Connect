import { useState } from 'react';
import { getInitials } from '../../utils/format.js';
import { cn } from '../../utils/cn.js';

const SIZES = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-14 text-lg',
  xl: 'size-20 text-2xl',
};

/** Avatar with image + initials fallback and optional online indicator. */
export function Avatar({ src, name, size = 'md', online = false, className }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      {showImage ? (
        <img
          src={src}
          alt={name ? `Photo of ${name}` : 'User avatar'}
          className={cn('rounded-full object-cover ring-1 ring-slate-200', SIZES[size])}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            'inline-flex items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700 ring-1 ring-slate-200',
            SIZES[size],
          )}
        >
          {getInitials(name)}
        </span>
      )}
      {online && (
        <span
          className="absolute bottom-0 right-0 size-2.5 rounded-full bg-accent-500 ring-2 ring-white"
          aria-label="Online"
        />
      )}
    </span>
  );
}
