import { api } from './api.js';

/** Role-scoped analytics (spec §30). */
export const analyticsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getMyAnalytics: build.query({
      query: () => ({ url: '/analytics/me' }),
      providesTags: ['Analytics'],
    }),
  }),
});

export const { useGetMyAnalyticsQuery } = analyticsApi;
