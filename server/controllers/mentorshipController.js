import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { parsePagination } from '../utils/pagination.js';
import {
  addSession,
  createReferralOffer,
  grantReferral,
  listMentors,
  listMyMentorships,
  listOpenReferralOffers,
  listReferrals,
  listSessions,
  requestMentorship,
  requestReferral,
  updateMentorshipStatus,
} from '../services/mentorshipService.js';

export const mentorsHandler = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = await listMentors({ area: req.query.area, page, limit });
  sendSuccess(res, { message: 'Mentors', data: result });
});

export const requestHandler = asyncHandler(async (req, res) => {
  const mentorship = await requestMentorship({
    mentorId: req.body.mentorId,
    studentId: req.user._id,
    area: req.body.area,
    message: req.body.message,
    goals: req.body.goals,
  });
  sendSuccess(res, { status: 201, message: 'Mentorship request sent', data: { mentorship } });
});

export const myMentorshipsHandler = asyncHandler(async (req, res) => {
  const items = await listMyMentorships({ userId: req.user._id });
  sendSuccess(res, { message: 'My mentorships', data: { items } });
});

export const updateStatusHandler = asyncHandler(async (req, res) => {
  const mentorship = await updateMentorshipStatus({ mentorshipId: req.params.id, userId: req.user._id, status: req.body.status, req });
  sendSuccess(res, { message: `Mentorship ${req.body.status}`, data: { mentorship } });
});

export const addSessionHandler = asyncHandler(async (req, res) => {
  const session = await addSession({ mentorshipId: req.params.id, userId: req.user._id, scheduledAt: req.body.scheduledAt, notes: req.body.notes });
  sendSuccess(res, { status: 201, message: 'Session scheduled', data: { session } });
});

export const listSessionsHandler = asyncHandler(async (req, res) => {
  const items = await listSessions({ mentorshipId: req.params.id, userId: req.user._id });
  sendSuccess(res, { message: 'Sessions', data: { items } });
});

export const createOfferHandler = asyncHandler(async (req, res) => {
  const referral = await createReferralOffer({ alumnusId: req.user._id, jobId: req.body.jobId, note: req.body.note });
  sendSuccess(res, { status: 201, message: 'Referral offer posted', data: { referral } });
});

export const myReferralsHandler = asyncHandler(async (req, res) => {
  const items = await listReferrals({ userId: req.user._id, role: req.user.role });
  sendSuccess(res, { message: 'Referrals', data: { items } });
});

export const listOpenOffersHandler = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = await listOpenReferralOffers({ page, limit });
  sendSuccess(res, { message: 'Open referral offers', data: result });
});

export const requestReferralHandler = asyncHandler(async (req, res) => {
  const referral = await requestReferral({ referralId: req.params.id, studentId: req.user._id });
  sendSuccess(res, { message: 'Referral requested', data: { referral } });
});

export const grantReferralHandler = asyncHandler(async (req, res) => {
  const referral = await grantReferral({ referralId: req.params.id, alumnusId: req.user._id });
  sendSuccess(res, { message: 'Referral granted', data: { referral } });
});
