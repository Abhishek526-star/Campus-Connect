import { useState } from 'react';
import { Link, NavLink } from 'react-router';
import { Menu, X } from 'lucide-react';
import { AppLogo } from '../common/AppLogo.jsx';
import { Button } from '../ui/Button.jsx';
import { IconButton } from '../ui/IconButton.jsx';
import { Drawer } from '../ui/Drawer.jsx';

const LINKS = [{ label: 'About', path: '/about' }];

/** Public site navigation (landing/auth pages). */
export function PublicNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="container-app flex h-16 items-center justify-between gap-4">
        <Link to="/" aria-label="Campus Connect home">
          <AppLogo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Public navigation">
          {LINKS.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button to="/login" variant="ghost">
            Log in
          </Button>
          <Button to="/register">Join Community</Button>
        </div>

        <IconButton label="Open menu" className="md:hidden" onClick={() => setOpen(true)}>
          <Menu />
        </IconButton>
      </div>

      <Drawer open={open} onClose={() => setOpen(false)} title="Menu">
        <nav className="flex flex-col gap-1 p-3" aria-label="Mobile navigation">
          {LINKS.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              {link.label}
            </NavLink>
          ))}
          <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4">
            <Button to="/login" variant="outline" onClick={() => setOpen(false)}>
              Log in
            </Button>
            <Button to="/register" onClick={() => setOpen(false)}>
              Join Community
            </Button>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-4 inline-flex items-center gap-2 self-start px-3 py-2 text-sm text-slate-500"
          >
            <X className="size-4" aria-hidden="true" /> Close
          </button>
        </nav>
      </Drawer>
    </header>
  );
}
