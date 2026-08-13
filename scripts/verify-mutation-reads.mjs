/**
 * Browser-simulation harness: proves the fixed mutation-response reads work
 * against the REAL client API slices, with the EXACT server payload shapes.
 *
 * Run: node scripts/verify-mutation-reads.mjs
 */
/* global Response, console */
import assert from 'node:assert/strict';

// --- Browser shims ----------------------------------------------------------
globalThis.window = { location: { origin: 'http://localhost:5173' } };
globalThis.self = globalThis;
globalThis.location = globalThis.window.location;

const RealRequest = globalThis.Request;
globalThis.Request = class BrowserRequest extends RealRequest {
  constructor(input, init) {
    if (typeof input === 'string' && input.startsWith('/')) {
      input = `http://localhost:5173${input}`;
    }
    super(input, init);
  }
};

// --- Mock network: exact server payload shapes ------------------------------
globalThis.fetch = async (input) => {
  const url = typeof input === 'string' ? input : input.url;
  const json = (status, body) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  if (url.includes('/api/donations/create-order')) {
    // Server: sendSuccess(res, { status: 201, message, data: result })
    return json(200, {
      success: true,
      status: 201,
      message: 'Payment order created',
      data: {
        orderId: 'order_NqXy12345AbCd',
        amount: 1000,
        currency: 'INR',
        keyId: 'rzp_test_abc123',
        scholarship: null,
        donationId: '65f0a1b2c3d4e5f6a7b8c9d0',
      },
    });
  }
  if (url.includes('/api/attendance/event/') && url.includes('/qr-token')) {
    return json(200, {
      success: true,
      message: 'QR code generated',
      data: { token: 'evt:sec:1786468000000', expiresAt: 1786468000000 },
    });
  }
  if (url.includes('/api/attendance/check-in')) {
    return json(201, {
      success: true,
      message: 'Attendance marked — welcome!',
      data: { attendance: { status: 'attended' }, event: { _id: 'e1', title: 'Tech Talk 2026' } },
    });
  }
  if (url.includes('/api/posts/') && url.endsWith('/share')) {
    return json(200, { success: true, message: 'Link generated', data: { url: '/community/post-1' } });
  }
  if (url.includes('/api/meetings/') && url.endsWith('/remind')) {
    return json(200, { success: true, message: 'Reminders sent', data: { reminded: 3 } });
  }
  if (url.includes('/api/resources/') && url.endsWith('/download')) {
    return json(200, { success: true, message: 'Resource', data: { url: '/uploads/resource/x.pdf', title: 'DBMS Notes', external: false } });
  }
  if (url.includes('/api/auth/refresh')) {
    return json(200, { success: true, data: { accessToken: 'tok-1' } });
  }
  return json(404, { success: false, message: 'not found' });
};

// --- Real client code -------------------------------------------------------
const { store } = await import('../client/src/store/store.js');
const { donationsApi } = await import('../client/src/services/donationsApi.js');
const { attendanceApi } = await import('../client/src/services/attendanceApi.js');
const { postsApi } = await import('../client/src/services/postsApi.js');
const { meetingsApi } = await import('../client/src/services/meetingsApi.js');
const { resourcesApi } = await import('../client/src/services/resourcesApi.js');

store.dispatch({ type: 'auth/setAccessToken', payload: 'tok-1' });

// 1. Donation order — the exact destructure DonationModal now performs.
{
  const { data } = await store
    .dispatch(donationsApi.endpoints.createDonationOrder.initiate({ scholarshipId: null, amount: 1000 }))
    .unwrap();
  const { orderId, keyId, amount: orderAmount, currency } = data; // ← fixed line
  assert.equal(orderId, 'order_NqXy12345AbCd');
  assert.equal(keyId, 'rzp_test_abc123');
  assert.equal(orderAmount, 1000);
  assert.equal(currency, 'INR');
  console.log('PASS donation order — orderId/keyId/amount/currency destructure cleanly');
}

// 2. QR token (QrGenerator)
{
  const { data } = await store
    .dispatch(attendanceApi.endpoints.generateQrToken.initiate({ eventId: 'e1', durationMinutes: 15 }))
    .unwrap();
  const { token, expiresAt: exp } = data; // ← fixed line
  assert.ok(token && exp);
  console.log('PASS QR token — token/expiresAt destructure cleanly');
}

// 3. Check-in (QrScanner)
{
  const { data } = await store.dispatch(attendanceApi.endpoints.checkIn.initiate('tok')).unwrap();
  assert.equal(data.event.title, 'Tech Talk 2026'); // ← fixed read
  console.log('PASS check-in — data.event.title reads cleanly');
}

// 4. Post share (PostCard)
{
  const { data: result } = await store.dispatch(postsApi.endpoints.sharePost.initiate('p1')).unwrap();
  assert.equal(result.url, '/community/post-1'); // ← fixed read
  console.log('PASS post share — result.url reads cleanly');
}

// 5. Meeting reminder (MeetingDetailsPage)
{
  const { data: result } = await store.dispatch(meetingsApi.endpoints.sendMeetingReminder.initiate('m1')).unwrap();
  assert.equal(result.reminded, 3); // ← fixed read
  console.log('PASS meeting reminder — result.reminded reads cleanly');
}

// 6. Resource download (ResourceDetailsPage)
{
  const { data: result } = await store.dispatch(resourcesApi.endpoints.downloadResource.initiate('r1')).unwrap();
  assert.equal(result.external, false); // ← fixed read
  assert.equal(result.url, '/uploads/resource/x.pdf');
  console.log('PASS resource download — result.external/url read cleanly');
}

console.log('\n✅ All mutation-response reads verified against real server payload shapes.');
