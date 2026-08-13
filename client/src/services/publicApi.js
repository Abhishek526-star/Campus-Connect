import { api } from './api.js';

/** Public, unauthenticated endpoints (landing page). */
export const publicApi = api.injectEndpoints({
  endpoints: (build) => ({
    getPublicStats: build.query({
      query: () => ({ url: '/public/stats' }),
    }),
  }),
});

export const { useGetPublicStatsQuery } = publicApi;
