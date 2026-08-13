import { NavLink, useNavigate } from 'react-router';
import { LogOut } from 'lucide-react';
import { useSelector } from 'react-redux';
import { NAV_SECTIONS } from '../../routes/navigation.js';
import { useLogoutMutation } from '../../services/authApi.js';
import { Avatar } from '../ui/Avatar.jsx';
import { IconButton } from '../ui/IconButton.jsx';
import { RoleBadge } from '../common/RoleBadge.jsx';
import { cn } from '../../utils/cn.js';

/** Desktop sidebar — navigation sections filtered by role. */
export function Sidebar() {
  const user = useSelector((state) => state.auth.user);
  const [logout] = useLogoutMutation();
  const navigate = useNavigate();

  const sections = NAV_SECTIONS.filter(
    (section) => section.items.some((item) => item.roles.includes(user?.role)) || section.adminOnly === false,
  ).map((section) => ({
    ...section,
    items: section.items.filter((item) => item.roles.includes(user?.role)),
  }));

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center border-b border-slate-100 px-5">
        <NavLink to="/dashboard" className="inline-flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary-600 shadow-sm">
            <span className="text-lg font-bold text-white">🎓</span>
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Campus<span className="text-primary-600">Connect</span>
          </span>
        </NavLink>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        {sections.map((section) => (
          <div key={section.title} className="mb-5">
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                      )
                    }
                  >
                    <item.icon className="size-4.5 shrink-0" aria-hidden="true" />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {user && (
        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <Avatar src={user.avatar?.url} name={user.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
              <RoleBadge role={user.role} size="sm" />
            </div>
            <IconButton label="Log out" variant="danger" onClick={handleLogout}>
              <LogOut />
            </IconButton>
          </div>
        </div>
      )}
    </aside>
  );
}
