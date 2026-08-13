import Donation from '../models/donation.js';
import Payment from '../models/payment.js';
import Scholarship from '../models/scholarship.js';
import { razorpay, verifyPaymentSignature } from '../config/razorpay.js';
import { env } from '../config/env.js';
import { badRequest, conflict, notFound } from '../utils/ApiError.js';
import { paginationMeta } from '../utils/pagination.js';
import { createNotification } from './notificationService.js';
import { logAudit } from '../utils/audit.js';
import { toPdfBuffer } from '../utils/exporters.js';
import { awardReputation } from './certificateService.js';

const MIN_AMOUNT = 1; // ₹1
const MAX_AMOUNT = 1000000; // ₹10,00,000

/**
 * Donations + Razorpay (spec §12):
 * create-order → Razorpay checkout → verify (HMAC) → webhook → receipt.
 * Card details never touch our server.
 */

/**
 * Step 1 — create a Razorpay order for a donation.
 * Requires RAZORPAY_KEY_ID/SECRET (test mode in development).
 */
export async function createDonationOrder({ donorId, scholarshipId, amount, message, anonymous, req }) {
  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount < MIN_AMOUNT || parsedAmount > MAX_AMOUNT) {
    throw badRequest(`Donation amount must be between ₹${MIN_AMOUNT} and ₹${MAX_AMOUNT.toLocaleString('en-IN')}`, 'INVALID_AMOUNT');
  }

  let scholarship = null;
  if (scholarshipId) {
    scholarship = await Scholarship.findById(scholarshipId).select('name status targetAmount raisedAmount deadline sponsor');
    if (!scholarship) throw notFound('Scholarship not found', 'SCHOLARSHIP_NOT_FOUND');
    if (scholarship.status !== 'active') throw badRequest('This scholarship is not accepting donations', 'SCHOLARSHIP_CLOSED');
    if (scholarship.deadline < new Date()) throw badRequest('The campaign deadline has passed', 'CAMPAIGN_CLOSED');
  }

  if (!razorpay) {
    throw badRequest(
      'Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to server/.env (test-mode keys) to enable donations.',
      'RAZORPAY_NOT_CONFIGURED',
    );
  }

  const order = await razorpay.orders.create({
    amount: Math.round(parsedAmount * 100), // paise
    currency: 'INR',
    receipt: `donation_${Date.now()}`,
    notes: { scholarshipId: scholarshipId ?? '', donorId: String(donorId) },
  });

  const donation = await Donation.create({
    donor: donorId,
    scholarship: scholarshipId ?? undefined,
    amount: parsedAmount,
    orderId: order.id,
    status: 'created',
    message: message ?? '',
    anonymous: anonymous ?? false,
  });

  await Payment.create({
    user: donorId,
    purpose: 'donation',
    referenceId: donation._id,
    amount: parsedAmount,
    orderId: order.id,
    status: 'created',
  });

  await logAudit({
    action: 'payment',
    actorId: donorId,
    targetType: 'donation',
    targetId: donation._id,
    details: { action: 'order_created', orderId: order.id, amount: parsedAmount },
    req,
  });

  return {
    orderId: order.id,
    amount: parsedAmount,
    currency: 'INR',
    keyId: env.razorpay.keyId,
    scholarship: scholarship ? { _id: scholarship._id, name: scholarship.name } : null,
    donationId: donation._id,
  };
}

/**
 * Step 3 — verify the payment returned by Razorpay checkout (HMAC-SHA256).
 * Marks the donation paid, credits the scholarship fund, sends receipt.
 */
export async function verifyDonation({ orderId, paymentId, signature, req }) {
  const donation = await Donation.findOne({ orderId });
  if (!donation) throw notFound('Donation not found', 'DONATION_NOT_FOUND');
  if (donation.status === 'paid') throw conflict('This donation is already verified', 'ALREADY_VERIFIED');

  if (!verifyPaymentSignature({ orderId, paymentId, signature })) {
    await logAudit({
      action: 'payment',
      actorId: donation.donor,
      targetType: 'donation',
      targetId: donation._id,
      details: { action: 'verify_failed', orderId, paymentId },
      req,
    });
    throw badRequest('Payment signature verification failed', 'INVALID_SIGNATURE');
  }

  donation.paymentId = paymentId;
  donation.signature = signature;
  donation.status = 'paid';
  donation.receiptNumber = `RCP-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;
  await donation.save();

  await Payment.findOneAndUpdate(
    { orderId },
    { $set: { paymentId, signature, status: 'paid' } },
  );

  // Credit the scholarship fund.
  if (donation.scholarship) {
    await Scholarship.updateOne({ _id: donation.scholarship }, { $inc: { raisedAmount: donation.amount } });
    const scholarship = await Scholarship.findById(donation.scholarship).select('name sponsor');
    await createNotification({
      recipientId: scholarship.sponsor,
      type: 'donation_success',
      title: 'New donation received',
      body: `₹${donation.amount.toLocaleString('en-IN')} donated to "${scholarship.name}"`,
      data: { url: `/scholarships/${donation.scholarship}` },
    });
  }

  await awardReputation({ userId: donation.donor, rule: 'donation' });
  await createNotification({
    recipientId: donation.donor,
    type: 'donation_success',
    title: 'Donation successful 🎉',
    body: `Your donation of ₹${donation.amount.toLocaleString('en-IN')} was received. Thank you for giving back!`,
    data: { url: '/donations' },
  });

  await logAudit({
    action: 'donation',
    actorId: donation.donor,
    targetType: 'donation',
    targetId: donation._id,
    details: { action: 'verified', orderId, paymentId, amount: donation.amount, receipt: donation.receiptNumber },
    req,
  });

  return donation;
}

/**
 * Razorpay webhook handler (spec §12): verifies the X-Razorpay-Signature over
 * the RAW body, then syncs payment.captured / payment.failed / refund.processed.
 */
export async function handleRazorpayWebhook({ rawBody, signature, req }) {
  if (!env.razorpay.webhookSecret) {
    throw badRequest('Webhook secret is not configured', 'WEBHOOK_NOT_CONFIGURED');
  }
  const { createHmac } = await import('node:crypto');
  const expected = createHmac('sha256', env.razorpay.webhookSecret).update(rawBody).digest('hex');
  if (signature !== expected) throw badRequest('Webhook signature verification failed', 'INVALID_WEBHOOK_SIGNATURE');

  const event = JSON.parse(rawBody);
  const entity = event.payload?.payment?.entity;
  const refundEntity = event.payload?.refund?.entity;
  // Payment events carry order_id on the payment entity; refund events on the refund entity.
  const orderId = entity?.order_id ?? refundEntity?.order_id;
  const paymentId = entity?.id ?? refundEntity?.payment_id;

  if (!orderId) return { handled: false, event: event.event };

  const donation = await Donation.findOne({ orderId });
  const payment = await Payment.findOne({ orderId });

  if (event.event === 'payment.captured') {
    await Donation.updateOne({ orderId }, { $set: { paymentId, status: 'paid' } });
    if (payment) {
      await Payment.updateOne({ orderId }, { $set: { paymentId, status: 'paid' } });
    }
  } else if (event.event === 'payment.failed') {
    await Donation.updateOne({ orderId }, { $set: { status: 'failed', paymentId } });
    if (payment) {
      await Payment.updateOne({ orderId }, { $set: { status: 'failed', paymentId, failureReason: entity?.error_description ?? '' } });
    }
  } else if (event.event === 'refund.processed') {
    const refund = event.payload?.refund?.entity;
    await Donation.updateOne({ orderId: refund?.order_id ?? orderId }, { $set: { status: 'refunded' } });
    if (payment) {
      await Payment.updateOne({ orderId: refund?.order_id ?? orderId }, { $set: { status: 'refunded', refundId: refund?.id } });
    }
  }

  await Payment.updateOne({ orderId }, { $push: { webhookEvents: event.event } });

  if (donation) {
    await logAudit({
      action: 'payment',
      actorId: donation.donor,
      targetType: 'donation',
      targetId: donation._id,
      details: { action: 'webhook', event: event.event, orderId, paymentId },
      req,
    });
  }

  return { handled: true, event: event.event };
}

/** Donor's own donations. */
export async function listMyDonations({ userId }) {
  const items = await Donation.find({ donor: userId })
    .sort({ createdAt: -1 })
    .populate({ path: 'scholarship', select: 'name' })
    .lean();
  return items;
}

/** Admin: all donations (spec §20 financial management). */
export async function listAllDonations({ page, limit }) {
  const [items, total] = await Promise.all([
    Donation.find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({ path: 'donor', select: 'name email' })
      .populate({ path: 'scholarship', select: 'name' })
      .lean(),
    Donation.countDocuments({}),
  ]);
  return { items, meta: paginationMeta(total, page, limit) };
}

/** Transparent funding stats (spec §12): target, raised, remaining, donors, students. */
export async function getFundingStats() {
  const scholarships = await Scholarship.find({ status: { $in: ['active', 'paused'] } })
    .select('targetAmount raisedAmount studentsSupported')
    .lean();

  const totals = scholarships.reduce(
    (acc, s) => {
      acc.target += s.targetAmount ?? 0;
      acc.raised += s.raisedAmount ?? 0;
      acc.students += s.studentsSupported ?? 0;
      return acc;
    },
    { target: 0, raised: 0, students: 0 },
  );

  const donorCount = await Donation.distinct('donor', { status: 'paid' });
  const totalDonors = donorCount.length;

  return {
    targetAmount: totals.target,
    raisedAmount: totals.raised,
    remainingAmount: Math.max(0, totals.target - totals.raised),
    fundedPercent: totals.target > 0 ? Math.round((totals.raised / totals.target) * 100) : 0,
    donorCount: totalDonors,
    studentsSupported: totals.students,
  };
}

/** Generate a PDF donation receipt (spec §12 download receipt). */
export async function generateReceiptPdf({ donationId, userId, role }) {
  const donation = await Donation.findById(donationId)
    .populate({ path: 'donor', select: 'name email' })
    .populate({ path: 'scholarship', select: 'name' })
    .lean();
  if (!donation) throw notFound('Donation not found', 'DONATION_NOT_FOUND');

  const isOwner = String(donation.donor._id) === String(userId);
  if (!isOwner && role !== 'admin') {
    const { forbidden } = await import('../utils/ApiError.js');
    throw forbidden('You cannot download this receipt', 'RECEIPT_FORBIDDEN');
  }

  const buffer = await toPdfBuffer({
    title: 'Donation Receipt',
    subtitle: `Campus Connect · Receipt ${donation.receiptNumber ?? donation.orderId}`,
    rows: [
      {
        donor: donation.donor?.name ?? '—',
        email: donation.donor?.email ?? '—',
        scholarship: donation.scholarship?.name ?? 'General fund',
        amount: `₹${donation.amount.toLocaleString('en-IN')}`,
        order: donation.orderId ?? '—',
        payment: donation.paymentId ?? '—',
        date: new Date(donation.createdAt).toLocaleString('en-IN'),
      },
    ],
    columns: [
      { key: 'donor', header: 'Donor', width: 26 },
      { key: 'email', header: 'Email', width: 30 },
      { key: 'scholarship', header: 'Scholarship', width: 26 },
      { key: 'amount', header: 'Amount (INR)', width: 15 },
      { key: 'order', header: 'Order ID', width: 18 },
      { key: 'payment', header: 'Payment ID', width: 18 },
      { key: 'date', header: 'Date', width: 22 },
    ],
    landscape: true,
  });

  return { buffer, filename: `receipt-${donation.receiptNumber ?? donation.orderId}.pdf` };
}
