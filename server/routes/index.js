import { Router } from 'express';
import { env } from '../config/env.js';
import authRoutes from './auth.js';
import uploadRoutes from './upload.js';
import notificationRoutes from './notifications.js';
import publicRoutes from './public.js';
import dashboardRoutes from './dashboard.js';
import userRoutes from './users.js';
import peopleRoutes from './people.js';
import chatRoutes from './chat.js';
import eventRoutes from './events.js';
import attendanceRoutes from './attendance.js';
import meetingRoutes from './meetings.js';
import scholarshipRoutes from './scholarships.js';
import donationRoutes from './donations.js';
import jobRoutes from './jobs.js';
import resourceRoutes from './resources.js';
import postRoutes from './posts.js';
import announcementRoutes from './announcements.js';
import searchRoutes from './search.js';
import mentorshipRoutes from './mentorship.js';
import certificateRoutes from './certificates.js';
import roadmapRoutes from './roadmaps.js';
import adminRoutes from './admin.js';
import operationsRoutes from './operations.js';
import analyticsRoutes from './analytics.js';
import reportRoutes from './reports.js';

const router = Router();

/**
 * GET /api/health
 * Liveness probe used by the frontend boot screen, deployment health checks, and uptime monitors.
 */
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'OK',
    data: {
      service: env.appName,
      status: 'up',
      uptime: Math.round(process.uptime()),
      node: process.version,
      timestamp: new Date().toISOString(),
    },
  });
});

router.use('/auth', authRoutes);
router.use('/upload', uploadRoutes);
router.use('/notifications', notificationRoutes);
router.use('/public', publicRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/users', userRoutes);
router.use('/', peopleRoutes);
router.use('/', chatRoutes);
router.use('/events', eventRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/meetings', meetingRoutes);
router.use('/scholarships', scholarshipRoutes);
router.use('/donations', donationRoutes);
router.use('/jobs', jobRoutes);
router.use('/resources', resourceRoutes);
router.use('/posts', postRoutes);
router.use('/announcements', announcementRoutes);
router.use('/search', searchRoutes);
router.use('/', mentorshipRoutes);
router.use('/certificates', certificateRoutes);
router.use('/roadmaps', roadmapRoutes);
router.use('/admin', adminRoutes);
router.use('/operations', operationsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/reports', reportRoutes);

export default router;
