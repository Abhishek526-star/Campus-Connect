import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button.jsx';

/** Top-level error boundary with a recover UI. */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message ?? 'Unexpected error' };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
          <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle className="size-6 text-red-500" aria-hidden="true" />
            </div>
            <h1 className="text-lg font-semibold text-slate-900">Something went wrong</h1>
            <p className="mt-1 text-sm text-slate-500">An unexpected error occurred. Please reload the page.</p>
            <Button className="mt-6" onClick={() => window.location.reload()}>
              Reload page
            </Button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}
