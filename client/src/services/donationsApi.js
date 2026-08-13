import { api } from './api.js';

/** Donations + Razorpay (spec §12). */
export const donationsApi = api.injectEndpoints({
  endpoints: (build) => ({
    createDonationOrder: build.mutation({
      query: (body) => ({ url: '/donations/create-order', method: 'POST', body }),
    }),
    verifyDonation: build.mutation({
      query: (body) => ({ url: '/donations/verify', method: 'POST', body }),
      invalidatesTags: ['Donation', 'Scholarship', 'Dashboard'],
    }),
    getMyDonations: build.query({
      query: () => ({ url: '/donations/mine' }),
      providesTags: ['Donation'],
    }),
    getDonationStats: build.query({
      query: () => ({ url: '/donations/stats' }),
      providesTags: ['Donation'],
    }),
    getAllDonations: build.query({
      query: (params) => ({ url: '/donations/admin', params }),
      providesTags: ['Donation'],
    }),
    downloadReceipt: build.mutation({
      query: (id) => ({
        url: `/donations/${id}/receipt`,
        // Raw binary on success; JSON errors keep Redux state serializable
        // and let getErrorMessage surface the server message.
        responseHandler: async (response) => (response.ok ? response.blob() : response.json()),
      }),
    }),
  }),
});

export const {
  useCreateDonationOrderMutation,
  useVerifyDonationMutation,
  useGetMyDonationsQuery,
  useGetDonationStatsQuery,
  useGetAllDonationsQuery,
  useDownloadReceiptMutation,
} = donationsApi;
