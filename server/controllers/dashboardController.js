import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { getDashboardData } from '../services/dashboardService.js';

/** GET /api/dashboard — personalized dashboard data (spec §5). */
export const getDashboard = asyncHandler(async (req, res) => {
  const data = await getDashboardData(req.user);
  sendSuccess(res, { message: 'Dashboard data', data });
});
