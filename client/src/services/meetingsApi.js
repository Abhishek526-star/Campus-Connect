import { api } from './api.js';

/** Meetings (spec §8). */
export const meetingsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getMeetings: build.query({
      query: (params) => ({ url: '/meetings', params }),
      providesTags: ['Meeting'],
    }),
    getMeeting: build.query({
      query: (id) => ({ url: `/meetings/${id}` }),
      providesTags: (result, _error, id) => [{ type: 'Meeting', id }],
    }),
    createMeeting: build.mutation({
      query: (body) => ({ url: '/meetings', method: 'POST', body }),
      invalidatesTags: ['Meeting', 'Dashboard'],
    }),
    updateMeeting: build.mutation({
      query: ({ id, body }) => ({ url: `/meetings/${id}`, method: 'PUT', body }),
      invalidatesTags: (result, _error, arg) => [{ type: 'Meeting', id: arg.id }, 'Meeting', 'Dashboard'],
    }),
    respondToMeeting: build.mutation({
      query: ({ id, status }) => ({ url: `/meetings/${id}/respond`, method: 'PATCH', body: { status } }),
      invalidatesTags: (result, _error, arg) => [{ type: 'Meeting', id: arg.id }, 'Meeting'],
    }),
    setMeetingStatus: build.mutation({
      query: ({ id, status }) => ({ url: `/meetings/${id}/status`, method: 'PATCH', body: { status } }),
      invalidatesTags: (result, _error, arg) => [{ type: 'Meeting', id: arg.id }, 'Meeting'],
    }),
    deleteMeeting: build.mutation({
      query: (id) => ({ url: `/meetings/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Meeting', 'Dashboard'],
    }),
    sendMeetingReminder: build.mutation({
      query: (id) => ({ url: `/meetings/${id}/remind`, method: 'POST' }),
    }),
  }),
});

export const {
  useGetMeetingsQuery,
  useGetMeetingQuery,
  useCreateMeetingMutation,
  useUpdateMeetingMutation,
  useRespondToMeetingMutation,
  useSetMeetingStatusMutation,
  useDeleteMeetingMutation,
  useSendMeetingReminderMutation,
} = meetingsApi;
