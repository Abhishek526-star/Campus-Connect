import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Award,
  BellRing,
  Briefcase,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  HandHeart,
  IndianRupee,
  ShieldCheck,
  UserCheck,
  Users,
  Video,
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useGetAdminStatsQuery, useGetAdminAnalyticsQuery, useGetModerationQueueQuery } from '../services/adminApi.js';
import { StatCard } from '../components/ui/StatCard.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Link } from 'react-router';
import { formatNumber } from '../utils/format.js';

const PIE_COLORS = ['#2563eb', '#059669', '#7c3aed', '#d97706'];

/**
 * Admin dashboard (spec §20): KPI cards + analytics charts (Recharts).
 */
export function AdminDashboardPage() {
  useDocumentTitle('Admin dashboard');
  const { data: statsData, isLoading, isError, refetch } = useGetAdminStatsQuery();
  const { data: analyticsData } = useGetAdminAnalyticsQuery();
  const { data: queueData } = useGetModerationQueueQuery();

  const s = statsData?.data;
  const a = analyticsData?.data;
  const q = queueData?.data;

  if (isError) return <ErrorState title="Could not load admin data" onRetry={refetch} />;

  const statCards = [
    { label: 'Total users', value: s?.totalUsers, icon: Users },
    { label: 'Students', value: s?.students, icon: GraduationCap },
    { label: 'Faculty', value: s?.faculty, icon: Award },
    { label: 'Alumni', value: s?.alumni, icon: UserCheck },
    { label: 'Active users', value: s?.activeUsers, icon: UserCheck },
    { label: 'Events', value: s?.events, icon: CalendarDays },
    { label: 'Upcoming events', value: s?.upcomingEvents, icon: CalendarDays },
    { label: 'Meetings', value: s?.meetings, icon: Video },
    { label: 'Scholarships', value: s?.scholarships, icon: HandHeart },
    { label: 'Donations', value: s?.donations, icon: IndianRupee },
    { label: 'Jobs', value: s?.jobs, icon: Briefcase },
    { label: 'Internships', value: s?.internships, icon: Briefcase },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <ShieldCheck className="size-5 text-primary-600" aria-hidden="true" />
            Admin dashboard
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">System-wide overview, users, and content.</p>
        </div>
        {s?.pendingRegistrations > 0 && (
          <Link
            to="/admin/users?status=pending"
            className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100"
          >
            <BellRing className="size-4" aria-hidden="true" />
            {s.pendingRegistrations} pending registration{s.pendingRegistrations > 1 ? 's' : ''}
          </Link>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.label} label={card.label} value={isLoading ? undefined : formatNumber(card.value ?? 0)} icon={card.icon} loading={isLoading} />
        ))}
      </div>

      {/* Moderation queue */}
      {q && (q.pendingJobs > 0 || q.pendingResources > 0 || q.pendingReports > 0) && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <ClipboardCheck className="size-5 text-amber-600" aria-hidden="true" />
            <p className="text-sm font-semibold text-amber-800">Moderation queue:</p>
            {q.pendingJobs > 0 && <Badge tone="warning">Jobs: {q.pendingJobs}</Badge>}
            {q.pendingResources > 0 && <Badge tone="warning">Resources: {q.pendingResources}</Badge>}
            {q.pendingReports > 0 && <Badge tone="danger">Reports: {q.pendingReports}</Badge>}
            <Link to="/admin/content" className="ml-auto text-sm font-semibold text-amber-800 hover:underline">Review →</Link>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User growth (6 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={a?.userGrowth ?? []}>
                <defs>
                  <linearGradient id="userGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="users" stroke="#2563eb" fill="url(#userGrowth)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Role distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={a?.roleDistribution ?? []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {PIE_COLORS.map((color, index) => (
                    <Cell key={index} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Event participation</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={a?.eventParticipation ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="registrations" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={a?.attendanceTrend ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="event" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="present" stroke="#059669" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scholarship funding</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={a?.scholarshipFunding ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="raised" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jobs vs Internships</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={a?.jobPostings ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="jobs" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
