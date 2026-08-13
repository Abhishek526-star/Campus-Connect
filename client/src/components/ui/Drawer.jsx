import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn.js';

/**
 * Slide-in panel (mobile navigation, filters). `side` selects left/right.
 */
export function Drawer({ open, onClose, side = 'left', title, children, className }) {
  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const isLeft = side === 'left';

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title ?? 'Drawer'}
        className={cn(
          'absolute top-0 flex h-full w-80 max-w-[85vw] flex-col bg-white shadow-2xl transition-transform',
          isLeft ? 'left-0 rounded-r-2xl' : 'right-0 rounded-l-2xl',
          className,
        )}
      >
        {title && (
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
