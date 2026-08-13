import { Outlet } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { Sidebar } from '../components/layout/Sidebar.jsx';
import { Topbar } from '../components/layout/Topbar.jsx';
import { MobileBottomNav } from '../components/layout/MobileBottomNav.jsx';
import { Drawer } from '../components/ui/Drawer.jsx';
import { closeSidebar } from '../store/slices/uiSlice.js';

/**
 * Authenticated app shell: desktop sidebar, topbar, mobile drawer + bottom nav.
 * Role filtering happens inside Sidebar via NAV_SECTIONS.
 */
export function AppLayout() {
  const dispatch = useDispatch();
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      <Drawer open={sidebarOpen} onClose={() => dispatch(closeSidebar())} title="Navigation" side="left">
        <Sidebar />
      </Drawer>

      <div className="lg:pl-64">
        <Topbar />
        <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-10">
          <Outlet />
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}
