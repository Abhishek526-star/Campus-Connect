import { api } from './api.js';

/** Announcements (spec §17). */
export const announcementsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getAnnouncements: build.query({
      query: (params) => ({ url: '/announcements', params }),
      providesTags: ['Announcement'],
    }),
    createAnnouncement: build.mutation({
      query: (body) => ({ url: '/announcements', method: 'POST', body }),
      invalidatesTags: ['Announcement', 'Dashboard'],
    }),
    updateAnnouncement: build.mutation({
      query: ({ id, body }) => ({ url: `/announcements/${id}`, method: 'PUT', body }),
      invalidatesTags: (result, _error, arg) => [{ type: 'Announcement', id: arg.id }, 'Announcement'],
    }),
    deleteAnnouncement: build.mutation({
      query: (id) => ({ url: `/announcements/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Announcement'],
    }),
    togglePin: build.mutation({
      query: (id) => ({ url: `/announcements/${id}/pin`, method: 'PATCH' }),
      invalidatesTags: (result, _error, id) => [{ type: 'Announcement', id }, 'Announcement'],
    }),
  }),
});

export const {
  useGetAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation,
  useDeleteAnnouncementMutation,
  useTogglePinMutation,
} = announcementsApi;
