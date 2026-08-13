import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '../../utils/cn.js';

/**
 * Tag input — type a value, press Enter/comma to add; click × to remove.
 * Controlled via `value` (array) + `onChange`.
 */
export function TagInput({ value = [], onChange, placeholder = 'Add…', max = 30, className, id, label }) {
  const [draft, setDraft] = useState('');

  const addTag = () => {
    const tag = draft.trim().replace(/,+$/, '');
    if (!tag) return;
    if (value.length >= max) return;
    if (value.some((item) => item.toLowerCase() === tag.toLowerCase())) {
      setDraft('');
      return;
    }
    onChange?.([...value, tag]);
    setDraft('');
  };

  const onKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTag();
    } else if (event.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange?.(value.slice(0, -1));
    }
  };

  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>}
      <div
        className={cn(
          'flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 shadow-sm transition-colors',
          'focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/25',
          className,
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange?.(value.filter((item) => item !== tag))}
              aria-label={`Remove ${tag}`}
              className="rounded-full p-0.5 hover:bg-primary-100"
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          id={id}
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={addTag}
          placeholder={value.length === 0 ? placeholder : ''}
          className="min-w-24 flex-1 border-none bg-transparent py-1 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
        {value.length < max && (
          <button
            type="button"
            onClick={addTag}
            aria-label="Add tag"
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-primary-600"
          >
            <Plus className="size-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-400">Press Enter to add · max {max}</p>
    </div>
  );
}
