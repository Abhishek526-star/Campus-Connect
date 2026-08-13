/**
 * Browser-simulation harness: proves the authenticated download flow works
 * end-to-end using the REAL client code (services/api.js + operationsApi).
 *
 * Simulates: browser globals, relative-URL Request, and a mock network that
 * returns 401 for a stale token, then 200 after /api/auth/refresh.
 *
 * Run: node scripts/verify-download-fix.mjs
 */
/* global Blob, Headers, Response, console */
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

// --- Mock network -----------------------------------------------------------
const calls = [];
globalThis.fetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : input.url;
  // fetchBaseQuery passes the headers on the Request object (input.headers);
  // manual calls pass them via init.headers.
  const headers = new Headers(init?.headers ?? input?.headers ?? {});
  const auth = headers.get('Authorization');
  calls.push({ url, auth });

  // Protected download: stale/absent token -> 401, valid token -> CSV blob.
  if (url.includes('/api/operations/reports/')) {
    if (!auth || auth === 'Bearer expired-token-123') {
      return new Response(
        JSON.stringify({ success: false, message: 'Authentication required', error: { code: 'NO_ACCESS_TOKEN' } }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }
    return new Response(new Blob(['Name,Email\nA,a@x.com'], { type: 'text/csv' }), {
      status: 200,
      headers: { 'Content-Type': 'text/csv' },
    });
  }

  // Refresh endpoint: issues a fresh access token.
  if (url.includes('/api/auth/refresh')) {
    return new Response(
      JSON.stringify({
        success: true,
        data: { accessToken: 'fresh-token-456', user: { id: 'u1', name: 'Admin', role: 'admin' } },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }

  return new Response(JSON.stringify({ success: false, message: 'not found' }), { status: 404 });
};

// --- Real client code -------------------------------------------------------
const { store } = await import('../client/src/store/store.js');
const { operationsApi } = await import('../client/src/services/operationsApi.js');

// Case 1: fresh token, no refresh needed.
store.dispatch({ type: 'auth/setAccessToken', payload: 'fresh-token-456' });
calls.length = 0;
let result = await store.dispatch(operationsApi.endpoints.downloadReport.initiate({ type: 'students', format: 'csv' })).unwrap();
assert.ok(result instanceof Blob, 'result must be a Blob');
assert.equal(await result.text(), 'Name,Email\nA,a@x.com', 'blob content mismatch');
assert.equal(calls.length, 1, 'expected exactly 1 request (no refresh)');
assert.equal(calls[0].auth, 'Bearer fresh-token-456', 'Authorization header must be attached');
console.log('PASS case 1 — fresh token: Blob returned, Authorization header attached, no refresh call');

// Case 2: expired token -> 401 -> refresh -> retry -> Blob.
store.dispatch({ type: 'auth/setAccessToken', payload: 'expired-token-123' });
calls.length = 0;
result = await store.dispatch(operationsApi.endpoints.downloadReport.initiate({ type: 'students', format: 'csv' })).unwrap();
assert.ok(result instanceof Blob, 'result must be a Blob after refresh+retry');
assert.equal(await result.text(), 'Name,Email\nA,a@x.com', 'blob content mismatch');
assert.equal(calls.length, 3, 'expected 3 requests (report -> refresh -> retry)');
assert.equal(calls[0].auth, 'Bearer expired-token-123', 'first attempt carries the stale token');
assert.ok(calls[1].url.endsWith('/api/auth/refresh'), 'second request must be refresh');
assert.equal(calls[1].auth, null, 'refresh uses the httpOnly cookie, no Authorization header');
assert.equal(calls[2].auth, 'Bearer fresh-token-456', 'retry must carry the rotated token');
assert.equal(store.getState().auth.accessToken, 'fresh-token-456', 'store token must be rotated');
console.log('PASS case 2 — expired token: 401 -> /api/auth/refresh -> retry with fresh token -> Blob');

// Case 3: refresh fails -> logged out, no infinite loop.
store.dispatch({ type: 'auth/setAccessToken', payload: 'dead-token' });
globalThis.fetch = async (input) => {
  const url = typeof input === 'string' ? input : input.url;
  if (url.includes('/api/operations/reports/')) {
    return new Response(
      JSON.stringify({ success: false, message: 'Authentication required', error: { code: 'NO_ACCESS_TOKEN' } }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }
  if (url.includes('/api/auth/refresh')) {
    return new Response(
      JSON.stringify({ success: false, message: 'Invalid refresh token', error: { code: 'INVALID_REFRESH_TOKEN' } }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }
  return new Response('{}', { status: 404 });
};
let attempts = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async (...args) => {
  attempts += 1;
  return originalFetch(...args);
};
await store.dispatch(operationsApi.endpoints.downloadReport.initiate({ type: 'students', format: 'csv' })).catch(() => {});
// resetApiState aborts the in-flight request — that is expected; what matters
// is the clean logout below with no unhandled TypeError and no retry storm.
assert.equal(attempts, 2, 'expected exactly 2 requests (no retry storm)');
assert.equal(store.getState().auth.status, 'unauthenticated', 'user must be logged out');
assert.equal(store.getState().auth.accessToken, null, 'token must be cleared');
console.log('PASS case 3 — dead refresh: exactly 2 requests, clean logout, no infinite loop, no crash');

console.log('\n✅ All download-flow assertions passed.');
