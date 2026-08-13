import { Link } from 'react-router';
import {
  Award,
  Briefcase,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  HandHeart,
  IndianRupee,
  MessageSquare,
  Users,
  Video,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useGetMyAnalyticsQuery } from '../services/analyticsApi.js';
import { StatCard } from '../components/ui/StatCard.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { formatINR, formatNumber } from '../utils/format.js';

/**
 * Personal analytics (spec §30): role-scoped metric cards with links
 * into the relevant modules.
 */
export function AnalyticsPage() {
  useDocumentTitle('My analytics');
  const me = useSelector((state) => state.auth.user);
  const { data, isLoading, isError, refetch } = useGetMyAnalyticsQuery();

  if (isError) return <ErrorState title="Could not load analytics" onRetry={refetch} />;

  const a = data?.data;

  const common = [
    { label: 'Events attended', value: a?.eventsAttended, icon: CalendarDays, to: '/attendance' },
    { label: 'Attendance rate', value: a ? `${a.attendancePercent}%` : undefined, icon: ClipboardCheck, to: '/attendance' },
    { label: 'Connections', value: a?.connections, icon: Users, to: '/people' },
    { label: 'Mentorships', value: a?.mentorships, icon: GraduationCap, to: '/mentorship' },
    { label: 'Saved items', value: a?.savedItems, icon: MessageSquare, to: '/search' },
  ];

  const roleCards = {
    student: [
      ...common,
      { label: 'Applications', value: a?.applications, icon: HandHeart, to: '/scholarships/applications' },
      { label: 'Registered events', value: a?.registeredEvents, icon: CalendarDays, to: '/events' },
      { label: 'Upcoming registrations', value: a?.upcomingRegistrations, icon: CalendarDays, to: '/events' },
    ],
    alumni: [
      ...common,
      { label: 'Donations made', value: a?.donations, icon: IndianRupee, to: '/donations' },
      { label: 'Total donated', value: a ? formatINR(a.donationTotal) : undefined, icon: IndianRupee, to: '/donations' },
      { label: 'Events organized', value: a?.eventsOrganized, icon: CalendarDays, to: '/events' },
      { label: 'Opportunities posted', value: a?.opportunitiesPosted, icon: Briefcase, to: '/opportunities' },
      { label: 'Students helped', value: a?.studentsHelped, icon: Award, to: '/mentorship' },
      { label: 'Active mentorships', value: a?.activeMentorships, icon: Video, to: '/mentorship' },
    ],
    faculty: [
      ...common,
      { label: 'Events organized', value: a?.eventsOrganized, icon: CalendarDays, to: '/events' },
      { label: 'Resources uploaded', value: a?.resourcesUploaded, icon: Award, to: '/resources' },
      { label: 'Students reached', value: a?.studentsReached, icon: Users, to: '/events' },
    ],
    admin: [...common],
  };

  const cards = roleCards[me?.role] ?? roleCards.admin;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">My analytics</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Your personal impact across the community as a <span className="font-medium capitalize">{me?.role}</span>.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.label} to={card.to} className="transition-transform hover:-translate-y-0.5">
            <StatCard label={card.label} value={isLoading ? undefined : formatNumber(card.value ?? 0)} icon={card.icon} loading={isLoading} />
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="py-6 text-center text-sm text-slate-400">
          Analytics update automatically as you participate — attend events, post, donate, and mentor to grow your impact.
        </CardContent>
      </Card>
    </div>
  );
}
