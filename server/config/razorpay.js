import { createHmac } from 'node:crypto';
import Razorpay from 'razorpay';
import { env } from './env.js';

/**
 * Razorpay client (test-mode keys in development).
 * null when keys are absent — payment endpoints return a clear setup error.
 */
export const razorpay = env.razorpay.isConfigured
  ? new Razorpay({
      key_id: env.razorpay.keyId,
      key_secret: env.razorpay.keySecret,
    })
  : null;

/**
 * Verify a Razorpay payment signature (order/payment/signature triplet) using
 * HMAC-SHA256 with the API key secret. Never trust the client blindly.
 */
export function verifyPaymentSignature({ orderId, paymentId, signature }) {
  const expected = createHmac('sha256', env.razorpay.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return signature === expected;
}
