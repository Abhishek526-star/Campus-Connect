import { api } from './api.js';

/** Personalized dashboard data (spec §5) — one aggregate endpoint. */
export const dashboardApi = api.injectEndpoints({
  endpoints: (build) => ({
    getDashboard: build.query({
      query: () => ({ url: '/dashboard' }),
      providesTags: ['Dashboard'],
    }),
  }),
});

export const { useGetDashboardQuery } = dashboardApi;
