import { api } from './api.js';

/** Admin endpoints (spec §20). */
export const adminApi = api.injectEndpoints({
  endpoints: (build) => ({
    getAdminStats: build.query({
      query: () => ({ url: '/admin/stats' }),
      providesTags: ['Admin'],
    }),
    getAdminAnalytics: build.query({
      query: () => ({ url: '/admin/analytics' }),
      providesTags: ['Admin'],
    }),
    getAdminUsers: build.query({
      query: (params) => ({ url: '/admin/users', params }),
      providesTags: ['Admin'],
    }),
    updateAdminUser: build.mutation({
      query: ({ id, body }) => ({ url: `/admin/users/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Admin'],
    }),
    deleteAdminUser: build.mutation({
      query: (id) => ({ url: `/admin/users/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Admin'],
    }),
    getModerationQueue: build.query({
      query: () => ({ url: '/admin/moderation' }),
      providesTags: ['Admin'],
    }),
    getReports: build.query({
      query: (params) => ({ url: '/admin/reports', params }),
      providesTags: ['Admin', 'Report'],
    }),
    resolveReport: build.mutation({
      query: ({ id, body }) => ({ url: `/admin/reports/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Admin', 'Report'],
    }),
  }),
});

export const {
  useGetAdminStatsQuery,
  useGetAdminAnalyticsQuery,
  useGetAdminUsersQuery,
  useUpdateAdminUserMutation,
  useDeleteAdminUserMutation,
  useGetModerationQueueQuery,
  useGetReportsQuery,
  useResolveReportMutation,
} = adminApi;
