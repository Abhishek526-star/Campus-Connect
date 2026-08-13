import {
  Award,
  Bell,
  BookOpen,
  Briefcase,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  Compass,
  Globe,
  GraduationCap,
  IndianRupee,
  LayoutDashboard,
  LayoutList,
  Map,
  Megaphone,
  MessageSquare,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
  UserCircle,
  Users,
  Video,
} from 'lucide-react';

export const ALL_ROLES = ['student', 'faculty', 'alumni', 'admin'];

/**
 * Sidebar navigation (spec §27), role-filtered. `roles` = which roles see the item.
 * Items ship as their pages are built; hidden items are simply not rendered yet.
 */
export const NAV_SECTIONS = [
  {
    title: 'General',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ALL_ROLES },
      { label: 'Community', path: '/community', icon: Globe, roles: ALL_ROLES },
      { label: 'People', path: '/people', icon: Users, roles: ALL_ROLES },
      { label: 'Search', path: '/search', icon: Search, roles: ALL_ROLES },
    ],
  },
  {
    title: 'Connect',
    items: [
      { label: 'Messages', path: '/messages', icon: MessageSquare, roles: ALL_ROLES },
      { label: 'Meetings', path: '/meetings', icon: Video, roles: ALL_ROLES },
      { label: 'Events', path: '/events', icon: CalendarDays, roles: ALL_ROLES },
      { label: 'Attendance', path: '/attendance', icon: ClipboardCheck, roles: ALL_ROLES },
    ],
  },
  {
    title: 'Opportunities',
    items: [
      { label: 'Scholarships', path: '/scholarships', icon: GraduationCap, roles: ALL_ROLES },
      { label: 'Jobs & Internships', path: '/opportunities', icon: Briefcase, roles: ALL_ROLES },
      { label: 'Study Resources', path: '/resources', icon: BookOpen, roles: ALL_ROLES },
      { label: 'Career Roadmaps', path: '/roadmaps', icon: Map, roles: ALL_ROLES },
      { label: 'Placement Prep', path: '/placement', icon: Briefcase, roles: ALL_ROLES },
      { label: 'Mentorship', path: '/mentorship', icon: Compass, roles: ALL_ROLES },
      { label: 'Certificates', path: '/certificates', icon: Award, roles: ALL_ROLES },
      { label: 'My Analytics', path: '/analytics', icon: CalendarCheck, roles: ALL_ROLES },
      { label: 'Announcements', path: '/announcements', icon: Megaphone, roles: ALL_ROLES },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Notifications', path: '/notifications', icon: Bell, roles: ALL_ROLES },
      { label: 'Profile', path: '/profile', icon: UserCircle, roles: ALL_ROLES },
    ],
  },
  {
    title: 'Administration',
    adminOnly: true,
    items: [
      { label: 'Admin Dashboard', path: '/admin', icon: ShieldCheck, roles: ['admin'] },
      { label: 'User Management', path: '/admin/users', icon: Users, roles: ['admin'] },
      { label: 'Content Moderation', path: '/admin/content', icon: LayoutList, roles: ['admin'] },
      { label: 'Finance', path: '/admin/finance', icon: IndianRupee, roles: ['admin'] },
      { label: 'Reports', path: '/admin/reports', icon: CalendarCheck, roles: ['admin'] },
      { label: 'Audit Logs', path: '/admin/audit-logs', icon: ScrollText, roles: ['admin'] },
      { label: 'Settings', path: '/admin/settings', icon: Settings, roles: ['admin'] },
    ],
  },
];

/** Resolve the page title for the topbar from the current path. */
export function findNavLabel(pathname) {
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (pathname.startsWith(item.path)) return item.label;
    }
  }
  return '';
}
