import { api } from './api.js';

/** Events (spec §9). */
export const eventsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getEvents: build.query({
      query: (params) => ({ url: '/events', params }),
      providesTags: ['Event'],
    }),
    getEvent: build.query({
      query: (id) => ({ url: `/events/${id}` }),
      providesTags: (result, _error, id) => [{ type: 'Event', id }],
    }),
    getMyEvents: build.query({
      query: () => ({ url: '/events/mine' }),
      providesTags: ['Event'],
    }),
    getEventParticipants: build.query({
      query: (id) => ({ url: `/events/${id}/participants` }),
      providesTags: (result, _error, id) => [{ type: 'Event', id }],
    }),
    createEvent: build.mutation({
      query: (body) => ({ url: '/events', method: 'POST', body }),
      invalidatesTags: ['Event', 'Dashboard'],
    }),
    updateEvent: build.mutation({
      query: ({ id, body }) => ({ url: `/events/${id}`, method: 'PUT', body }),
      invalidatesTags: (result, _error, arg) => [{ type: 'Event', id: arg.id }, 'Event', 'Dashboard'],
    }),
    deleteEvent: build.mutation({
      query: (id) => ({ url: `/events/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Event', 'Dashboard'],
    }),
    registerForEvent: build.mutation({
      query: (id) => ({ url: `/events/${id}/register`, method: 'POST' }),
      invalidatesTags: (result, _error, id) => [{ type: 'Event', id }, 'Event', 'Dashboard'],
    }),
    cancelEventRegistration: build.mutation({
      query: (id) => ({ url: `/events/${id}/register`, method: 'DELETE' }),
      invalidatesTags: (result, _error, id) => [{ type: 'Event', id }, 'Event', 'Dashboard'],
    }),
  }),
});

export const {
  useGetEventsQuery,
  useGetEventQuery,
  useGetMyEventsQuery,
  useGetEventParticipantsQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  useRegisterForEventMutation,
  useCancelEventRegistrationMutation,
} = eventsApi;
