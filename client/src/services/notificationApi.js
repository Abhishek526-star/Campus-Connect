import { api } from './api.js';
import { setUnreadCount } from '../store/slices/notificationSlice.js';

export const notificationApi = api.injectEndpoints({
  endpoints: (build) => ({
    getNotifications: build.query({
      query: (params = {}) => ({ url: '/notifications', params }),
      providesTags: ['Notification'],
    }),
    getUnreadCount: build.query({
      query: () => ({ url: '/notifications/unread-count' }),
      providesTags: ['Notification'],
      onQueryStarted: async (_args, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          dispatch(setUnreadCount(data.data.count));
        } catch {
          // ignore — badge stays at socket-driven value
        }
      },
    }),
    markNotificationRead: build.mutation({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PATCH' }),
      invalidatesTags: ['Notification'],
    }),
    markAllNotificationsRead: build.mutation({
      query: () => ({ url: '/notifications/read-all', method: 'PATCH' }),
      invalidatesTags: ['Notification'],
    }),
    deleteNotification: build.mutation({
      query: (id) => ({ url: `/notifications/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Notification'],
    }),
    clearNotifications: build.mutation({
      query: () => ({ url: '/notifications', method: 'DELETE' }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
  useClearNotificationsMutation,
} = notificationApi;
