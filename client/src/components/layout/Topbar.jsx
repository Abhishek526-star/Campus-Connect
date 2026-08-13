import { useLocation } from 'react-router';
import { Menu } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { openSidebar } from '../../store/slices/uiSlice.js';
import { findNavLabel } from '../../routes/navigation.js';
import { IconButton } from '../ui/IconButton.jsx';
import { GlobalSearchBar } from './GlobalSearchBar.jsx';
import { NotificationBell } from './NotificationBell.jsx';
import { UserMenu } from './UserMenu.jsx';

/** App topbar — mobile menu trigger, page title, global search, notifications, user menu. */
export function Topbar() {
  const dispatch = useDispatch();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const title = findNavLabel(location.pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <IconButton label="Open navigation menu" className="lg:hidden" onClick={() => dispatch(openSidebar())}>
          <Menu />
        </IconButton>
        <h1 className="text-base font-semibold text-slate-900 sm:text-lg">{title || 'Campus Connect'}</h1>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <GlobalSearchBar />
        <NotificationBell />
        {user && <UserMenu />}
      </div>
    </header>
  );
}
