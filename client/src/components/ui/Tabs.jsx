import { useId } from 'react';
import { cn } from '../../utils/cn.js';

/**
 * Accessible tabs (WAI-ARIA tabs pattern with arrow-key navigation).
 * Controlled: pass `value` + `onChange`.
 */
export function Tabs({ value, onChange, tabs = [], className }) {
  const baseId = useId();

  const onKeyDown = (event, index) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    onChange?.(tabs[next].value);
    document.getElementById(`${baseId}-tab-${next}`)?.focus();
  };

  return (
    <div role="tablist" aria-label="Tabs" className={cn('flex gap-1 border-b border-slate-200', className)}>
      {tabs.map((tab, index) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            id={`${baseId}-tab-${index}`}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls={`${baseId}-panel-${index}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange?.(tab.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              '-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              selected
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700',
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="rounded-full bg-primary-100 px-1.5 py-0.5 text-[10px] font-bold text-primary-700">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
