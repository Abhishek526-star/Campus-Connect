import { Routes, Route } from 'react-router';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx';
import { ProtectedRoute } from './routes/ProtectedRoute.jsx';
import { PublicOnlyRoute } from './routes/PublicOnlyRoute.jsx';
import { AppLayout } from './layouts/AppLayout.jsx';
import { PublicLayout } from './layouts/PublicLayout.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { PeoplePage } from './pages/PeoplePage.jsx';
import { ConnectionRequestsPage } from './pages/ConnectionRequestsPage.jsx';
import { MessagesPage } from './pages/MessagesPage.jsx';
import { NotificationsPage } from './pages/NotificationsPage.jsx';
import { EventsPage } from './pages/EventsPage.jsx';
import { EventDetailsPage } from './pages/EventDetailsPage.jsx';
import { AttendancePage } from './pages/AttendancePage.jsx';
import { AttendanceManagePage } from './pages/AttendanceManagePage.jsx';
import { MeetingsPage } from './pages/MeetingsPage.jsx';
import { MeetingDetailsPage } from './pages/MeetingDetailsPage.jsx';
import { ScholarshipsPage } from './pages/ScholarshipsPage.jsx';
import { ScholarshipDetailsPage } from './pages/ScholarshipDetailsPage.jsx';
import { MyScholarshipApplicationsPage } from './pages/MyScholarshipApplicationsPage.jsx';
import { ReviewApplicationsPage } from './pages/ReviewApplicationsPage.jsx';
import { DonationsPage } from './pages/DonationsPage.jsx';
import { OpportunitiesPage } from './pages/OpportunitiesPage.jsx';
import { OpportunityDetailsPage } from './pages/OpportunityDetailsPage.jsx';
import { ResourcesPage } from './pages/ResourcesPage.jsx';
import { ResourceDetailsPage } from './pages/ResourceDetailsPage.jsx';
import { CommunityPage } from './pages/CommunityPage.jsx';
import { AnnouncementsPage } from './pages/AnnouncementsPage.jsx';
import { SearchPage } from './pages/SearchPage.jsx';
import { MentorshipPage } from './pages/MentorshipPage.jsx';
import { CertificatesPage } from './pages/CertificatesPage.jsx';
import { CertificateVerifyPage } from './pages/CertificateVerifyPage.jsx';
import { RoadmapsPage } from './pages/RoadmapsPage.jsx';
import { RoadmapDetailsPage } from './pages/RoadmapDetailsPage.jsx';
import { PlacementPrepPage } from './pages/PlacementPrepPage.jsx';
import { AdminDashboardPage } from './pages/AdminDashboardPage.jsx';
import { AdminUsersPage } from './pages/AdminUsersPage.jsx';
import { AdminContentPage } from './pages/AdminContentPage.jsx';
import { AdminFinancePage } from './pages/AdminFinancePage.jsx';
import { AdminReportsPage } from './pages/AdminReportsPage.jsx';
import { AdminAuditLogsPage } from './pages/AdminAuditLogsPage.jsx';
import { AdminSettingsPage } from './pages/AdminSettingsPage.jsx';
import { AnalyticsPage } from './pages/AnalyticsPage.jsx';
import { AdminLayout } from './layouts/AdminLayout.jsx';
import { RoleRoute } from './routes/RoleRoute.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { AboutPage } from './pages/AboutPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.jsx';
import { ResetPasswordPage } from './pages/ResetPasswordPage.jsx';
import { VerifyEmailPage } from './pages/VerifyEmailPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';
import { ForbiddenPage } from './pages/ForbiddenPage.jsx';
import { useSessionBootstrap } from './hooks/useSessionBootstrap.js';
import { useAuthSocket } from './hooks/useAuthSocket.js';

/**
 * Route tree.
 *
 * Public pages: Landing, About. Login/Register/Forgot/Reset/Verify arrive
 * page by page under PublicOnlyRoute (Phase 4).
 * Authenticated feature pages are added inside the ProtectedRoute tree.
 */
export default function App() {
  useSessionBootstrap();
  useAuthSocket();

  return (
    <ErrorBoundary>
      <Routes>
        {/* Public marketing pages */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Route>

        {/* Public (auth) pages */}
        <Route element={<PublicOnlyRoute />}>
          <Route element={<PublicLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
          </Route>
        </Route>

        {/* Authenticated app shell */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:id" element={<ProfilePage />} />
            <Route path="/people" element={<PeoplePage />} />
            <Route path="/connections/requests" element={<ConnectionRequestsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/messages/:conversationId" element={<MessagesPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailsPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/attendance/event/:eventId" element={<AttendanceManagePage />} />
            <Route path="/meetings" element={<MeetingsPage />} />
            <Route path="/meetings/:id" element={<MeetingDetailsPage />} />
            <Route path="/scholarships" element={<ScholarshipsPage />} />
            <Route path="/scholarships/applications" element={<MyScholarshipApplicationsPage />} />
            <Route path="/scholarships/review" element={<ReviewApplicationsPage />} />
            <Route path="/donations" element={<DonationsPage />} />
            <Route path="/opportunities" element={<OpportunitiesPage />} />
            <Route path="/opportunities/:id" element={<OpportunityDetailsPage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/resources/:id" element={<ResourceDetailsPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/announcements" element={<AnnouncementsPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/mentorship" element={<MentorshipPage />} />
            <Route path="/certificates" element={<CertificatesPage />} />
            <Route path="/roadmaps" element={<RoadmapsPage />} />
            <Route path="/roadmaps/:role" element={<RoadmapDetailsPage />} />
            <Route path="/placement" element={<PlacementPrepPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />

            {/* Admin section */}
            <Route element={<RoleRoute roles={['admin']} />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/content" element={<AdminContentPage />} />
                <Route path="/admin/finance" element={<AdminFinancePage />} />
                <Route path="/admin/reports" element={<AdminReportsPage />} />
                <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
                <Route path="/admin/settings" element={<AdminSettingsPage />} />
              </Route>
            </Route>
            <Route path="/scholarships/:id" element={<ScholarshipDetailsPage />} />
            {/* Feature pages are added here page by page */}
          </Route>
        </Route>

        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="/certificates/verify" element={<CertificateVerifyPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <Toaster richColors position="top-right" closeButton />
    </ErrorBoundary>
  );
}
