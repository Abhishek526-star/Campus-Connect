import { api } from './api.js';

/** Jobs & opportunities (spec §14). */
export const jobsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getJobs: build.query({
      query: (params) => ({ url: '/jobs', params }),
      providesTags: ['Job'],
    }),
    getJob: build.query({
      query: (id) => ({ url: `/jobs/${id}` }),
      providesTags: (result, _error, id) => [{ type: 'Job', id }],
    }),
    getSavedJobs: build.query({
      query: () => ({ url: '/jobs/saved' }),
      providesTags: ['Job'],
    }),
    createJob: build.mutation({
      query: (body) => ({ url: '/jobs', method: 'POST', body }),
      invalidatesTags: ['Job', 'Dashboard'],
    }),
    updateJob: build.mutation({
      query: ({ id, body }) => ({ url: `/jobs/${id}`, method: 'PUT', body }),
      invalidatesTags: (result, _error, arg) => [{ type: 'Job', id: arg.id }, 'Job'],
    }),
    deleteJob: build.mutation({
      query: (id) => ({ url: `/jobs/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Job', 'Dashboard'],
    }),
    saveJob: build.mutation({
      query: (jobId) => ({ url: '/jobs/save', method: 'POST', body: { jobId } }),
      invalidatesTags: ['Job'],
    }),
    unsaveJob: build.mutation({
      query: (jobId) => ({ url: '/jobs/save', method: 'DELETE', body: { jobId } }),
      invalidatesTags: ['Job'],
    }),
    applyToJob: build.mutation({
      query: (jobId) => ({ url: '/jobs/apply', method: 'POST', body: { jobId } }),
      invalidatesTags: (result, _error, jobId) => [{ type: 'Job', id: jobId }, 'Job'],
    }),
    reportJob: build.mutation({
      query: (body) => ({ url: '/jobs/report', method: 'POST', body }),
    }),
    moderateJob: build.mutation({
      query: ({ id, status }) => ({ url: `/jobs/${id}/moderate`, method: 'PUT', body: { status } }),
      invalidatesTags: (result, _error, arg) => [{ type: 'Job', id: arg.id }, 'Job'],
    }),
  }),
});

export const {
  useGetJobsQuery,
  useGetJobQuery,
  useGetSavedJobsQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useDeleteJobMutation,
  useSaveJobMutation,
  useUnsaveJobMutation,
  useApplyToJobMutation,
  useReportJobMutation,
  useModerateJobMutation,
} = jobsApi;
