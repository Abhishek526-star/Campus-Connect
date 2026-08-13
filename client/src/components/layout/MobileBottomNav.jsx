import { NavLink } from 'react-router';
import { Bell, CalendarDays, Globe, LayoutDashboard, MessageSquare } from 'lucide-react';
import { cn } from '../../utils/cn.js';

const ITEMS = [
  { label: 'Home', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Community', path: '/community', icon: Globe },
  { label: 'Events', path: '/events', icon: CalendarDays },
  { label: 'Messages', path: '/messages', icon: MessageSquare },
  { label: 'Alerts', path: '/notifications', icon: Bell },
];

/** Mobile bottom navigation (spec §28). */
export function MobileBottomNav() {
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="flex items-stretch justify-around">
        {ITEMS.map((item) => (
          <li key={item.path} className="flex-1">
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
                  isActive ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600',
                )
              }
            >
              <item.icon className="size-5" aria-hidden="true" />
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
