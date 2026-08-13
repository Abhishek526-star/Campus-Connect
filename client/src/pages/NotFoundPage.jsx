import { SearchX } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { Button } from '../components/ui/Button.jsx';

/** 404 page. */
export function NotFoundPage() {
  useDocumentTitle('Page not found');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <SearchX className="size-8 text-slate-400" aria-hidden="true" />
      </span>
      <p className="mt-6 text-6xl font-black tracking-tight text-primary-600">404</p>
      <h1 className="mt-2 text-xl font-semibold text-slate-900">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        The page you're looking for doesn't exist or is still being built.
      </p>
      <Button className="mt-8" to="/">
        Back to home
      </Button>
    </main>
  );
}
