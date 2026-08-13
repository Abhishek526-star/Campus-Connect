import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useClickOutside } from '../../hooks/useClickOutside.js';
import { cn } from '../../utils/cn.js';

/**
 * Lightweight dropdown menu (click-outside + ESC close, keyboard accessible).
 */
export function DropdownMenu({ trigger, label, children, align = 'right', className }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  useClickOutside(rootRef, () => setOpen(false), open);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        className="inline-flex items-center gap-1 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
      >
        {trigger}
        <ChevronDown
          className={cn('size-3.5 text-slate-400 transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            'absolute z-30 mt-2 min-w-48 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function MenuItem({ children, onClick, destructive = false, className, icon: Icon }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={() => onClick?.()}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors',
        destructive ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-100',
        className,
      )}
    >
      {Icon && <Icon className="size-4" aria-hidden="true" />}
      {children}
    </button>
  );
}
