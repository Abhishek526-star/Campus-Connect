import { Link } from 'react-router';
import {
  Bell,
  BookOpen,
  Briefcase,
  CalendarDays,
  CalendarPlus,
  CheckCheck,
  GraduationCap,
  HandHeart,
  IndianRupee,
  MapPin,
  Megaphone,
  MessageSquare,
  Pin,
  Sparkles,
  UploadCloud,
  UserPlus,
  Video,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useGetDashboardQuery } from '../services/dashboardApi.js';
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
} from '../services/notificationApi.js';
import { Avatar } from '../components/ui/Avatar.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { ProgressBar } from '../components/ui/ProgressBar.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { RoleBadge } from '../components/common/RoleBadge.jsx';
import { formatDate, formatINR, formatNumber, formatTime, timeAgo } from '../utils/format.js';
import { cn } from '../utils/cn.js';
import { NOTIFICATION_TYPE_META, ROLE_LABELS } from '../constants/index.js';

/* ---------------------------------------------------------------------------
 * Quick actions (spec §5) — tiles light up as their target pages ship.
 * Disabled tiles are explicitly marked "Soon" — no fake buttons.
 * ------------------------------------------------------------------------- */
const QUICK_ACTIONS = [
  { id: 'create-event', icon: CalendarPlus, label: 'Create Event', roles: ['faculty', 'alumni', 'admin'], path: '/events?create=1' },
  { id: 'schedule-meeting', icon: Video, label: 'Schedule Meeting', roles: ['student', 'faculty', 'alumni', 'admin'], path: '/meetings?create=1' },
  { id: 'find-alumni', icon: GraduationCap, label: 'Find Alumni', roles: ['student', 'faculty', 'alumni', 'admin'], path: '/people?tab=alumni' },
  { id: 'find-students', icon: UserPlus, label: 'Find Students', roles: ['student', 'faculty', 'alumni', 'admin'], path: '/people?tab=students' },
  { id: 'post-opportunity', icon: Briefcase, label: 'Post Opportunity', roles: ['faculty', 'alumni', 'admin'], path: '/opportunities?create=1' },
  { id: 'apply-scholarship', icon: HandHeart, label: 'Apply Scholarship', roles: ['student'], path: '/scholarships' },
  { id: 'donate', icon: IndianRupee, label: 'Donate', roles: ['faculty', 'alumni', 'admin'], path: '/donations' },
  { id: 'upload-resource', icon: UploadCloud, label: 'Upload Resource', roles: ['faculty', 'alumni', 'admin'], path: '/resources?upload=1' },
  { id: 'start-chat', icon: MessageSquare, label: 'Start Chat', roles: ['student', 'faculty', 'alumni', 'admin'], path: '/messages' },
];

function QuickActions({ role }) {
  const actions = QUICK_ACTIONS.filter((action) => action.roles.includes(role));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
          {actions.map((action) => (
            <Link
              key={action.id}
              to={action.path}
              className="group flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary-50 transition-colors group-hover:bg-primary-100">
                <action.icon className="size-5 text-primary-600" aria-hidden="true" />
              </span>
              <span className="text-[11px] font-medium leading-tight text-slate-700">{action.label}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------------------------------------------------------------------------
 * Widgets
 * ------------------------------------------------------------------------- */

function WidgetShell({ title, icon: Icon, action, children, loading, emptyIcon, emptyTitle, emptyDescription, className }) {
  return (
    <Card className={cn('flex h-full flex-col', className)}>
      <CardHeader>
        <CardTitle className="inline-flex items-center gap-2">
          <Icon className="size-4 text-primary-500" aria-hidden="true" />
          {title}
        </CardTitle>
        {action}
      </CardHeader>
      <CardContent className="flex-1">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : children.length === 0 ? (
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
          />
        ) : (
          <ul className="divide-y divide-slate-100">{children}</ul>
        )}
      </CardContent>
    </Card>
  );
}

const EVENTS_EMPTY = { icon: CalendarDays, title: 'No upcoming events', description: 'Events will appear here as organizers publish them.' };
const MEETINGS_EMPTY = { icon: Video, title: 'No upcoming meetings', description: 'Schedule a meeting or accept invitations to see them here.' };
const OPPORTUNITIES_EMPTY = { icon: Briefcase, title: 'No open opportunities', description: 'New jobs and internships posted by alumni will show up here.' };
const SCHOLARSHIPS_EMPTY = { icon: HandHeart, title: 'No active campaigns', description: 'Alumni-funded scholarship campaigns appear here.' };
const RESOURCES_EMPTY = { icon: BookOpen, title: 'No resources yet', description: 'Approved study resources will appear here.' };
const POSTS_EMPTY = { icon: Sparkles, title: 'No posts yet', description: 'Community posts will appear here.' };
const PEOPLE_EMPTY = { icon: GraduationCap, title: 'No suggestions yet', description: 'We recommend people from your department as you grow your network.' };
const ANNOUNCEMENTS_EMPTY = { icon: Megaphone, title: 'No announcements', description: 'Official announcements will appear here.' };

export function DashboardPage() {
  useDocumentTitle('Dashboard');
  const user = useSelector((state) => state.auth.user);

  const { data, isLoading, isError, refetch } = useGetDashboardQuery();
  const { data: notificationsData } = useGetNotificationsQuery({ page: 1, limit: 5 });
  const [markAll] = useMarkAllNotificationsReadMutation();

  if (isError) {
    return <ErrorState title="Could not load your dashboard" message="Please try again." onRetry={refetch} />;
  }

  const d = data?.data;
  const notifications = notificationsData?.data?.items ?? [];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary-800 via-primary-700 to-accent-800 shadow-lg shadow-primary-900/20">
        <CardContent className="flex flex-col items-start justify-between gap-5 px-6 py-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <span className="ring-4 ring-white/15 rounded-full">
              <Avatar src={user?.avatar?.url} name={user?.name} size="lg" />
            </span>
            <div>
              <p className="text-sm font-medium text-primary-100">
                {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'},
              </p>
              <h2 className="text-2xl font-bold text-white">{user?.name}</h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold text-white ring-1 ring-white/20">
                  {ROLE_LABELS[user?.role]}
                </span>
                {user?.badges?.map((badge) => (
                  <span key={badge} className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-accent-200 ring-1 ring-white/15">
                    {badge.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 ring-1 ring-white/15">
            <Sparkles className="size-4 text-accent-300" aria-hidden="true" />
            <p className="text-xs font-medium text-white">
              {formatNumber(user?.reputationScore ?? 0)} reputation points
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <QuickActions role={user?.role} />

      {/* Events + Meetings */}
      <div className="grid gap-6 lg:grid-cols-2">
        <WidgetShell
          title="Upcoming events"
          icon={CalendarDays}
          loading={isLoading}
          {...EVENTS_EMPTY}
          action={
            <Button variant="ghost" size="sm" to="/events">
              View all
            </Button>
          }
        >
          {d?.upcomingEvents?.map((event) => (
            <li key={event._id} className="flex items-start gap-3 py-3">
              <span className="flex size-10 shrink-0 flex-col items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                <span className="text-xs font-bold leading-none">{formatDate(event.date).split(' ')[0]}</span>
                <span className="text-[9px] font-medium uppercase">{formatDate(event.date).split(' ')[1]}</span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{event.title}</p>
                <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                  <span>{formatTime(event.startTime)}</span>
                  {event.mode === 'offline' ? (
                    <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{event.venue || 'On campus'}</span>
                  ) : (
                    <Badge tone="accent" size="sm">Online</Badge>
                  )}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {event.registrationsCount}/{event.maxParticipants} registered · by {event.organizer?.name}
                </p>
              </div>
            </li>
          ))}
        </WidgetShell>

        <WidgetShell
          title="Upcoming meetings"
          icon={Video}
          loading={isLoading}
          {...MEETINGS_EMPTY}
          action={
            <Button variant="ghost" size="sm" to="/meetings">
              View all
            </Button>
          }
        >
          {d?.upcomingMeetings?.map((meeting) => (
            <li key={meeting._id} className="flex items-start gap-3 py-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-50">
                <Video className="size-4.5 text-violet-600" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{meeting.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatDate(meeting.date)} · {formatTime(meeting.startTime)}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge tone={meeting.status === 'accepted' ? 'success' : meeting.status === 'pending' ? 'warning' : 'primary'} size="sm">
                    {meeting.status}
                  </Badge>
                  <span className="text-[11px] text-slate-400">by {meeting.organizer?.name}</span>
                </div>
              </div>
            </li>
          ))}
        </WidgetShell>
      </div>

      {/* Announcements */}
      <WidgetShell
        title="Recent announcements"
        icon={Megaphone}
        loading={isLoading}
        {...ANNOUNCEMENTS_EMPTY}
        action={
          <Button variant="ghost" size="sm" to="/announcements">
            View all
          </Button>
        }
      >
        {d?.recentAnnouncements?.map((announcement) => (
          <li key={announcement._id} className="flex items-start gap-3 py-3">
            <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-50">
              {announcement.pinned ? <Pin className="size-4 text-amber-500" aria-hidden="true" /> : <Megaphone className="size-4 text-amber-500" aria-hidden="true" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{announcement.title}</p>
              <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{announcement.body}</p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {announcement.author?.name} · {timeAgo(announcement.createdAt)}
              </p>
            </div>
          </li>
        ))}
      </WidgetShell>

      {/* Opportunities / Scholarships / Resources */}
      <div className="grid gap-6 lg:grid-cols-3">
        <WidgetShell
          title="New opportunities"
          icon={Briefcase}
          loading={isLoading}
          {...OPPORTUNITIES_EMPTY}
          action={
            <Button variant="ghost" size="sm" to="/opportunities">
              View all
            </Button>
          }
        >
          {d?.newOpportunities?.map((job) => (
            <li key={job._id} className="py-3">
              <p className="text-sm font-semibold text-slate-900">{job.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">{job.company} · {job.location || 'Remote'}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <Badge tone="primary" size="sm">{job.type}</Badge>
                <Badge tone="slate" size="sm">{job.workMode}</Badge>
                {job.deadline && <span className="text-[11px] text-slate-400">by {formatDate(job.deadline)}</span>}
              </div>
            </li>
          ))}
        </WidgetShell>

        <WidgetShell
          title="Scholarship campaigns"
          icon={HandHeart}
          loading={isLoading}
          {...SCHOLARSHIPS_EMPTY}
          action={
            <Button variant="ghost" size="sm" to="/scholarships">
              View all
            </Button>
          }
        >
          {d?.scholarshipCampaigns?.map((scholarship) => {
            const percent = scholarship.targetAmount ? (scholarship.raisedAmount / scholarship.targetAmount) * 100 : 0;
            return (
              <li key={scholarship._id} className="py-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-semibold text-slate-900">{scholarship.name}</p>
                  <span className="shrink-0 text-xs font-bold text-accent-600">{Math.round(percent)}%</span>
                </div>
                <ProgressBar value={percent} tone="accent" className="mt-2" />
                <p className="mt-1.5 text-[11px] text-slate-400">
                  {formatINR(scholarship.raisedAmount)} raised of {formatINR(scholarship.targetAmount)} · by {scholarship.sponsor?.name}
                </p>
              </li>
            );
          })}
        </WidgetShell>

        <WidgetShell
          title="Study resources"
          icon={BookOpen}
          loading={isLoading}
          {...RESOURCES_EMPTY}
          action={
            <Button variant="ghost" size="sm" to="/resources">
              View all
            </Button>
          }
        >
          {d?.studyResources?.map((resource) => (
            <li key={resource._id} className="py-3">
              <p className="truncate text-sm font-semibold text-slate-900">{resource.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {resource.category}{resource.subCategory ? ` · ${resource.subCategory}` : ''}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className="text-amber-500">★</span> {resource.avgRating?.toFixed(1) || 'New'}
                <span>· {formatNumber(resource.ratingCount)} ratings · {resource.uploadedBy?.name}</span>
              </p>
            </li>
          ))}
        </WidgetShell>
      </div>

      {/* Posts + People + Notifications */}
      <div className="grid gap-6 lg:grid-cols-3">
        <WidgetShell
          title="Recent community posts"
          icon={Sparkles}
          loading={isLoading}
          {...POSTS_EMPTY}
          className="lg:col-span-2"
          action={
            <Button variant="ghost" size="sm" to="/community">
              View all
            </Button>
          }
        >
          {d?.recentPosts?.map((post) => (
            <li key={post._id} className="flex items-start gap-3 py-3">
              <Avatar src={post.author?.avatar?.url} name={post.author?.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500">
                  <span className="font-semibold text-slate-800">{post.author?.name}</span>
                  {' · '}{timeAgo(post.createdAt)}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-700">{post.content}</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  <Badge tone="primary" size="sm">{post.type}</Badge>
                  <span className="ml-2">♥ {post.counts?.likes} · 💬 {post.counts?.comments}</span>
                </p>
              </div>
            </li>
          ))}
        </WidgetShell>

        <div className="space-y-6">
          <WidgetShell
            title="Recommended people"
            icon={GraduationCap}
            loading={isLoading}
            {...PEOPLE_EMPTY}
          >
            {d?.recommendedPeople?.map((person) => (
              <li key={person._id} className="flex items-center gap-3 py-2.5">
                <Avatar src={person.avatar?.url} name={person.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{person.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {person.profile?.currentCompany
                      ? `${person.profile.currentCompany} · ${person.profile.designation ?? ''}`
                      : person.profile?.department ?? ROLE_LABELS[person.role]}
                  </p>
                </div>
                <RoleBadge role={person.role} size="sm" />
              </li>
            ))}
          </WidgetShell>
        </div>
      </div>

      {/* Notifications preview */}
      <Card>
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <Bell className="size-4 text-primary-500" aria-hidden="true" /> Recent notifications
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => markAll().unwrap().catch(() => {})}>
            <CheckCheck className="size-3.5" aria-hidden="true" /> Mark all read
          </Button>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <EmptyState
              title="No notifications yet"
              description="Messages, events, meetings, and scholarship updates will appear here."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {notifications.map((notification) => {
                const meta = NOTIFICATION_TYPE_META[notification.type];
                return (
                  <li key={notification._id} className="flex items-start gap-3 py-3">
                    <span className={`mt-1.5 size-2 shrink-0 rounded-full ${notification.isRead ? 'bg-slate-200' : 'bg-primary-500'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900">{notification.title}</p>
                      {notification.body && <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{notification.body}</p>}
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {timeAgo(notification.createdAt)} · {meta?.label ?? notification.type}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-3 border-t border-slate-100 pt-3 text-center">
            <Link to="/notifications" className="text-xs font-semibold text-primary-600 hover:text-primary-700">
              View all notifications
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
