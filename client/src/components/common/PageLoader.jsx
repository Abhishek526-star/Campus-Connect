import { GraduationCap, Loader2 } from 'lucide-react';

/** Full-screen loading screen shown during session bootstrap. */
export function PageLoader({ label = 'Loading Campus Connect…' }) {
  return (
    <div
      role="status"
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900"
    >
      <div className="flex size-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
        <GraduationCap className="size-7 text-white" aria-hidden="true" />
      </div>
      <p className="flex items-center gap-2 text-sm font-medium text-white/90">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        {label}
      </p>
    </div>
  );
}
