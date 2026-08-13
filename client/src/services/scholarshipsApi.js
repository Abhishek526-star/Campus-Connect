import { api } from './api.js';

/** Scholarships (spec §11, §13). */
export const scholarshipsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getScholarships: build.query({
      query: (params) => ({ url: '/scholarships', params }),
      providesTags: ['Scholarship'],
    }),
    getScholarship: build.query({
      query: (id) => ({ url: `/scholarships/${id}` }),
      providesTags: (result, _error, id) => [{ type: 'Scholarship', id }],
    }),
    createScholarship: build.mutation({
      query: (body) => ({ url: '/scholarships', method: 'POST', body }),
      invalidatesTags: ['Scholarship', 'Dashboard'],
    }),
    updateScholarship: build.mutation({
      query: ({ id, body }) => ({ url: `/scholarships/${id}`, method: 'PUT', body }),
      invalidatesTags: (result, _error, arg) => [{ type: 'Scholarship', id: arg.id }, 'Scholarship'],
    }),
    applyForScholarship: build.mutation({
      query: (body) => ({ url: `/scholarships/${body.scholarshipId}/apply`, method: 'POST', body }),
      invalidatesTags: (result, _error, arg) => [{ type: 'Scholarship', id: arg.scholarshipId }, 'Scholarship'],
    }),
    getMyApplications: build.query({
      query: () => ({ url: '/scholarships/applications/mine' }),
      providesTags: ['Application'],
    }),
    getReviewApplications: build.query({
      query: (params) => ({ url: '/scholarships/applications/review', params }),
      providesTags: ['Application'],
    }),
    getApplication: build.query({
      query: (id) => ({ url: `/scholarships/applications/${id}` }),
      providesTags: (result, _error, id) => [{ type: 'Application', id }],
    }),
    reviewApplication: build.mutation({
      query: ({ id, body }) => ({ url: `/scholarships/applications/${id}/review`, method: 'PUT', body }),
      invalidatesTags: (result, _error, arg) => [{ type: 'Application', id: arg.id }, 'Application', 'Dashboard'],
    }),
    addApplicationComment: build.mutation({
      query: ({ id, text }) => ({ url: `/scholarships/applications/${id}/comment`, method: 'POST', body: { text } }),
      invalidatesTags: (result, _error, arg) => [{ type: 'Application', id: arg.id }],
    }),
  }),
});

export const {
  useGetScholarshipsQuery,
  useGetScholarshipQuery,
  useCreateScholarshipMutation,
  useUpdateScholarshipMutation,
  useApplyForScholarshipMutation,
  useGetMyApplicationsQuery,
  useGetReviewApplicationsQuery,
  useGetApplicationQuery,
  useReviewApplicationMutation,
  useAddApplicationCommentMutation,
} = scholarshipsApi;
