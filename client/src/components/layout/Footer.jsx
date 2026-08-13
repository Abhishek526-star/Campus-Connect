import { GraduationCap, Heart } from 'lucide-react';
import { AppLogo } from '../common/AppLogo.jsx';

const COLUMNS = [
  {
    title: 'Platform',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Community', href: '/#community' },
      { label: 'Events', href: '/#events' },
      { label: 'Scholarships', href: '/#scholarships' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Study Resources', href: '/#resources' },
      { label: 'Jobs & Internships', href: '/#opportunities' },
      { label: 'Career Opportunities', href: '/#careers' },
    ],
  },
];

/** Public site footer. */
export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="container-app grid gap-10 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <AppLogo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-500">
            A unified digital community connecting students, faculty, and alumni for learning,
            mentorship, careers, scholarships, and lifelong collaboration.
          </p>
          <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-slate-500">
            Made with <Heart className="size-3.5 fill-red-500 text-red-500" aria-hidden="true" /> by the
            campus community
          </p>
        </div>
        {COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h3 className="text-sm font-semibold text-slate-900">{column.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-slate-500 transition-colors hover:text-primary-600">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-slate-100">
        <div className="container-app flex flex-col items-center justify-between gap-2 py-5 text-xs text-slate-400 sm:flex-row">
          <span>© {new Date().getFullYear()} Campus Connect. All rights reserved.</span>
          <span className="inline-flex items-center gap-1.5">
            <GraduationCap className="size-3.5" aria-hidden="true" /> Connect. Learn. Give Back. Grow Together.
          </span>
        </div>
      </div>
    </footer>
  );
}
