import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { setAccessToken, loggedOut } from '../store/slices/authSlice.js';

/**
 * RTK Query root API.
 *
 * Transport strategy (spec §3, §25):
 * - Access token kept in memory, attached as `Authorization: Bearer`.
 * - Refresh token in httpOnly cookie (rotating, server-side).
 * - On 401 from non-auth endpoints, a single-flight refresh is attempted;
 *   the original request is retried once with the fresh token.
 */

const rawBaseQuery = fetchBaseQuery({
  baseUrl: '/api',
  credentials: 'include',
  // Attach the in-memory access token to every request (spec §25).
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

/** Auth endpoints never trigger the refresh loop (e.g. failed logins). */
const isAuthEndpoint = (args) => typeof args === 'string' ? args.startsWith('/auth/') : String(args?.url ?? '').startsWith('/auth/');

let refreshInFlight = null;

async function tryRefresh(api) {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  const body = await response.json().catch(() => null);
  if (response.ok && body?.success) {
    api.dispatch(setAccessToken(body.data.accessToken));
    return true;
  }
  return false;
}

const baseQueryWithRefresh = async (args, apiCtx, extraOptions) => {
  const result = await rawBaseQuery(args, apiCtx, extraOptions);

  if (
    result.error?.status === 401 &&
    !isAuthEndpoint(args) &&
    !refreshInFlight
  ) {
    refreshInFlight = tryRefresh(apiCtx).finally(() => {
      refreshInFlight = null;
    });
    const refreshed = await refreshInFlight;
    if (refreshed) {
      // Retry the original request once with the rotated access token.
      return rawBaseQuery(args, apiCtx, extraOptions);
    }
    // Refresh failed — log out cleanly. `apiCtx.dispatch` is the store's
    // dispatch; `api.util.resetApiState` (an action creator on the module-level
    // createApi instance) clears all cached endpoint state.
    apiCtx.dispatch(loggedOut());
    apiCtx.dispatch(api.util.resetApiState());
  }

  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithRefresh,
  tagTypes: ['Auth', 'Notification', 'Profile', 'Conversation', 'Message', 'Dashboard', 'Event'],
  endpoints: () => ({}),
});
