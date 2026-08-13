import { api } from './api.js';

/** Attendance + QR (spec §10). */
export const attendanceApi = api.injectEndpoints({
  endpoints: (build) => ({
    generateQrToken: build.mutation({
      query: ({ eventId, durationMinutes = 15 }) => ({
        url: `/attendance/event/${eventId}/qr-token`,
        method: 'POST',
        body: { durationMinutes },
      }),
      invalidatesTags: ['Attendance'],
    }),
    checkIn: build.mutation({
      query: (qrToken) => ({ url: '/attendance/check-in', method: 'POST', body: { qrToken } }),
      invalidatesTags: ['Attendance', 'Event'],
    }),
    checkOut: build.mutation({
      query: (eventId) => ({ url: `/attendance/event/${eventId}/check-out`, method: 'POST' }),
      invalidatesTags: ['Attendance'],
    }),
    getEventAttendance: build.query({
      query: (eventId) => ({ url: `/attendance/event/${eventId}` }),
      providesTags: ['Attendance'],
    }),
    getEventSummary: build.query({
      query: (eventId) => ({ url: `/attendance/event/${eventId}/summary` }),
      providesTags: ['Attendance'],
    }),
    markManual: build.mutation({
      query: ({ eventId, body }) => ({ url: `/attendance/event/${eventId}/manual`, method: 'POST', body }),
      invalidatesTags: ['Attendance'],
    }),
    editAttendance: build.mutation({
      query: ({ id, eventId, status }) => ({
        url: `/attendance/${id}`,
        method: 'PUT',
        params: { eventId },
        body: { status },
      }),
      invalidatesTags: ['Attendance'],
    }),
    getMyAttendance: build.query({
      query: (userId) => ({ url: `/attendance/user/${userId}` }),
      providesTags: ['Attendance'],
    }),
    downloadAttendanceExport: build.mutation({
      query: ({ eventId, format }) => ({
        url: `/attendance/event/${eventId}/export`,
        params: { format },
        // Raw binary on success; JSON errors keep Redux state serializable
        // and let getErrorMessage surface the server message.
        responseHandler: async (response) => (response.ok ? response.blob() : response.json()),
      }),
    }),
  }),
});

export const {
  useGenerateQrTokenMutation,
  useCheckInMutation,
  useCheckOutMutation,
  useGetEventAttendanceQuery,
  useGetEventSummaryQuery,
  useMarkManualMutation,
  useEditAttendanceMutation,
  useGetMyAttendanceQuery,
  useDownloadAttendanceExportMutation,
} = attendanceApi;
