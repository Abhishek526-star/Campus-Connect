import { api } from './api.js';

/** Admin operations: reports, audit logs, settings (spec §20, §39, §40). */
export const operationsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getReportTypes: build.query({
      query: () => ({ url: '/operations/reports/types' }),
    }),
    downloadReport: build.mutation({
      query: ({ type, format }) => ({
        url: `/operations/reports/${type}`,
        params: { format },
        // Raw binary on success; JSON errors keep Redux state serializable
        // and let getErrorMessage surface the server message.
        responseHandler: async (response) => (response.ok ? response.blob() : response.json()),
      }),
    }),
    getAuditLogs: build.query({
      query: (params) => ({ url: '/operations/audit-logs', params }),
      providesTags: ['Audit'],
    }),
    getAuditActions: build.query({
      query: () => ({ url: '/operations/audit-logs/actions' }),
    }),
    getSettings: build.query({
      query: () => ({ url: '/operations/settings' }),
      providesTags: ['Settings'],
    }),
    updateSettings: build.mutation({
      query: (body) => ({ url: '/operations/settings', method: 'PUT', body }),
      invalidatesTags: ['Settings'],
    }),
  }),
});

export const {
  useGetReportTypesQuery,
  useDownloadReportMutation,
  useGetAuditLogsQuery,
  useGetAuditActionsQuery,
  useGetSettingsQuery,
  useUpdateSettingsMutation,
} = operationsApi;
