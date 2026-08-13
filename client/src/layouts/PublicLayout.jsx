import { Outlet } from 'react-router';
import { PublicNavbar } from '../components/layout/PublicNavbar.jsx';
import { Footer } from '../components/layout/Footer.jsx';

/** Layout for public pages (landing, auth pages). */
export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <PublicNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
