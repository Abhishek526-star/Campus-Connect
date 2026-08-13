import { api } from './api.js';

/** Certificates (spec §29). */
export const certificatesApi = api.injectEndpoints({
  endpoints: (build) => ({
    getMyCertificates: build.query({
      query: () => ({ url: '/certificates/mine' }),
      providesTags: ['Certificate'],
    }),
    issueCertificates: build.mutation({
      query: (eventId) => ({ url: `/certificates/event/${eventId}/issue`, method: 'POST' }),
      invalidatesTags: ['Certificate'],
    }),
    verifyCertificate: build.query({
      query: (certificateId) => ({ url: `/certificates/verify`, params: { certificateId } }),
    }),
  }),
});

export const {
  useGetMyCertificatesQuery,
  useIssueCertificatesMutation,
  useVerifyCertificateQuery,
} = certificatesApi;
