import { api } from './api.js';

/** Individual member reports (admin/faculty/alumni) — full profile PDF + photo. */
export const reportsApi = api.injectEndpoints({
  endpoints: (build) => ({
    downloadMemberReport: build.mutation({
      query: ({ userId }) => ({
        url: `/reports/member/${userId}`,
        // Raw binary PDF on success; JSON errors keep Redux state serializable.
        responseHandler: async (response) => (response.ok ? response.blob() : response.json()),
      }),
    }),
  }),
});

export const { useDownloadMemberReportMutation } = reportsApi;
