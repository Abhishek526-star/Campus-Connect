import { Router } from 'express';
import User from '../models/user.js';
import Job from '../models/job.js';
import ScholarshipApplication from '../models/scholarshipApplication.js';

const router = Router();

/**
 * Public (unauthenticated) endpoints used by the landing page.
 */

/**
 * GET /api/public/stats
 * Live community statistics (spec §49) — real counts, no hardcoding.
 */
router.get('/stats', async (_req, res) => {
  const activeRoles = {
    student: 'student',
    faculty: 'faculty',
    alumni: 'alumni',
  };

  const [students, faculty, alumni, opportunitiesPosted, fundedApplications, supportedStudents] =
    await Promise.all([
      User.countDocuments({ role: activeRoles.student, isApproved: true, isActive: true }),
      User.countDocuments({ role: activeRoles.faculty, isApproved: true, isActive: true }),
      User.countDocuments({ role: activeRoles.alumni, isApproved: true, isActive: true }),
      Job.countDocuments({ status: 'approved' }),
      ScholarshipApplication.countDocuments({ status: { $in: ['funded', 'completed'] } }),
      ScholarshipApplication.distinct('student', {
        status: { $in: ['approved', 'funded', 'completed'] },
      }),
    ]);

  res.json({
    success: true,
    message: 'Community statistics',
    data: {
      students,
      alumni,
      faculty,
      scholarshipsFunded: fundedApplications,
      studentsSupported: supportedStudents.length,
      opportunitiesPosted,
    },
  });
});

export default router;
