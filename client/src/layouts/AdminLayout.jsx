import { Outlet } from 'react-router';
import { ShieldCheck } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

/** Admin section layout — wraps admin pages with a consistent header. */
export function AdminLayout() {
  useDocumentTitle('Admin');
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 rounded-2xl border border-primary-200 bg-primary-50/60 px-4 py-3">
        <ShieldCheck className="size-5 text-primary-700" aria-hidden="true" />
        <p className="text-sm font-semibold text-primary-800">Administration — all actions are audit-logged</p>
      </div>
      <Outlet />
    </div>
  );
}
