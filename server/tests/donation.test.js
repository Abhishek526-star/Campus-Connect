import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createHmac } from 'node:crypto';
import request from 'supertest';
import { app, clearDB, connectTestDB, disconnectTestDB, createUser, loginToken } from './helpers.js';
import Donation from '../models/donation.js';

beforeAll(async () => {
  await connectTestDB();
});
afterAll(async () => {
  await disconnectTestDB();
});
beforeEach(async () => {
  await clearDB();
});

const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

const sign = (data) => createHmac('sha256', KEY_SECRET).update(data).digest('hex');
const signWebhook = (body) => createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex');

describe('Donations + Razorpay verification (spec §12)', () => {
  it('rejects an invalid payment signature', async () => {
    await createUser({ email: 'd@test.edu', role: 'alumni' });
    const token = await loginToken('d@test.edu');
    const User = (await import('../models/user.js')).default;
    const donor = await User.findOne({ email: 'd@test.edu' });
    await Donation.create({ donor: donor._id, amount: 1000, orderId: 'order_T1', status: 'created' });

    const res = await request(app)
      .post('/api/donations/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: 'order_T1', paymentId: 'pay_T1', signature: 'definitely-wrong' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_SIGNATURE');
  });

  it('verifies a valid signature, marks paid, and blocks double verification', async () => {
    await createUser({ email: 'd2@test.edu', role: 'alumni' });
    const token = await loginToken('d2@test.edu');
    const User = (await import('../models/user.js')).default;
    const donor = await User.findOne({ email: 'd2@test.edu' });
    await Donation.create({ donor: donor._id, amount: 5000, orderId: 'order_T2', status: 'created' });

    const sig = sign('order_T2|pay_T2');
    const ok = await request(app)
      .post('/api/donations/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: 'order_T2', paymentId: 'pay_T2', signature: sig });
    expect(ok.status).toBe(200);
    expect(ok.body.data.donation.status).toBe('paid');
    expect(ok.body.data.donation.receiptNumber).toMatch(/^RCP-/);

    const dup = await request(app)
      .post('/api/donations/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: 'order_T2', paymentId: 'pay_T2', signature: sig });
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe('ALREADY_VERIFIED');
  });

  it('rejects webhooks with an invalid signature', async () => {
    const body = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { order_id: 'order_W1', id: 'pay_W1' } } } });
    const res = await request(app)
      .post('/api/donations/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', 'bogus')
      .send(body);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_WEBHOOK_SIGNATURE');
  });

  it('processes payment.captured and refund.processed webhooks with valid signatures', async () => {
    await createUser({ email: 'd3@test.edu', role: 'alumni' });
    const User = (await import('../models/user.js')).default;
    const donor = await User.findOne({ email: 'd3@test.edu' });
    await Donation.create({ donor: donor._id, amount: 3000, orderId: 'order_W2', status: 'created' });

    const captured = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { order_id: 'order_W2', id: 'pay_W2' } } } });
    const res1 = await request(app)
      .post('/api/donations/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', signWebhook(captured))
      .send(captured);
    expect(res1.status).toBe(200);
    expect(res1.body.data.event).toBe('payment.captured');

    let donation = await Donation.findOne({ orderId: 'order_W2' }).lean();
    expect(donation.status).toBe('paid');

    const refunded = JSON.stringify({ event: 'refund.processed', payload: { refund: { entity: { id: 'rfnd_1', order_id: 'order_W2', payment_id: 'pay_W2' } } } });
    const res2 = await request(app)
      .post('/api/donations/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', signWebhook(refunded))
      .send(refunded);
    expect(res2.status).toBe(200);

    donation = await Donation.findOne({ orderId: 'order_W2' }).lean();
    expect(donation.status).toBe('refunded');
  });

  it('rejects invalid donation amounts at order creation', async () => {
    await createUser({ email: 'd4@test.edu', role: 'alumni' });
    const token = await loginToken('d4@test.edu');
    const res = await request(app)
      .post('/api/donations/create-order')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: -5 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
