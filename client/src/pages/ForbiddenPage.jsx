import { ShieldX } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { Button } from '../components/ui/Button.jsx';

/** 403 — role-based access denied. */
export function ForbiddenPage() {
  useDocumentTitle('Access denied');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <ShieldX className="size-8 text-red-400" aria-hidden="true" />
      </span>
      <p className="mt-6 text-6xl font-black tracking-tight text-red-500">403</p>
      <h1 className="mt-2 text-xl font-semibold text-slate-900">Access denied</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        You don't have permission to view this page with your current role.
      </p>
      <div className="mt-8 flex gap-3">
        <Button variant="outline" to="/dashboard">
          Go to dashboard
        </Button>
      </div>
    </main>
  );
}
