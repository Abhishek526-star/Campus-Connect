import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { parsePagination } from '../utils/pagination.js';
import {
  createDonationOrder,
  generateReceiptPdf,
  getFundingStats,
  handleRazorpayWebhook,
  listAllDonations,
  listMyDonations,
  verifyDonation,
} from '../services/donationService.js';

/** POST /api/donations/create-order — Razorpay order (spec §12 step 1). */
export const createOrder = asyncHandler(async (req, res) => {
  const result = await createDonationOrder({
    donorId: req.user._id,
    scholarshipId: req.body.scholarshipId,
    amount: req.body.amount,
    message: req.body.message,
    anonymous: req.body.anonymous,
    req,
  });
  sendSuccess(res, { status: 201, message: 'Payment order created', data: result });
});

/** POST /api/donations/verify — HMAC verification (spec §12 step 3). */
export const verify = asyncHandler(async (req, res) => {
  const donation = await verifyDonation({
    orderId: req.body.orderId,
    paymentId: req.body.paymentId,
    signature: req.body.signature,
    req,
  });
  sendSuccess(res, { message: 'Payment verified — thank you for your donation!', data: { donation } });
});

/** POST /api/donations/webhook — raw body + signature verification. */
export const webhook = asyncHandler(async (req, res) => {
  const result = await handleRazorpayWebhook({
    rawBody: req.rawBody,
    signature: req.get('x-razorpay-signature'),
    req,
  });
  sendSuccess(res, { message: 'Webhook received', data: result });
});

/** GET /api/donations/mine — donor history. */
export const getMine = asyncHandler(async (req, res) => {
  const items = await listMyDonations({ userId: req.user._id });
  sendSuccess(res, { message: 'My donations', data: { items } });
});

/** GET /api/donations/admin — all donations (admin). */
export const getAll = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = await listAllDonations({ page, limit });
  sendSuccess(res, { message: 'All donations', data: result });
});

/** GET /api/donations/stats — transparent funding dashboard (spec §12). */
export const stats = asyncHandler(async (_req, res) => {
  const data = await getFundingStats();
  sendSuccess(res, { message: 'Funding statistics', data });
});

/** GET /api/donations/:id/receipt — PDF receipt (owner/admin). */
export const receipt = asyncHandler(async (req, res) => {
  const { buffer, filename } = await generateReceiptPdf({
    donationId: req.params.id,
    userId: req.user._id,
    role: req.user.role,
  });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
});
