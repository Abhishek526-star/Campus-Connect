import { api } from './api.js';

/** Mentorship + referrals (spec §29). */
export const mentorshipApi = api.injectEndpoints({
  endpoints: (build) => ({
    getMentors: build.query({
      query: (params) => ({ url: '/mentors', params }),
      providesTags: ['Mentorship'],
    }),
    getMyMentorships: build.query({
      query: () => ({ url: '/mentorships' }),
      providesTags: ['Mentorship'],
    }),
    requestMentorship: build.mutation({
      query: (body) => ({ url: '/mentorships', method: 'POST', body }),
      invalidatesTags: ['Mentorship'],
    }),
    updateMentorshipStatus: build.mutation({
      query: ({ id, status }) => ({ url: `/mentorships/${id}/status`, method: 'PATCH', body: { status } }),
      invalidatesTags: ['Mentorship'],
    }),
    addMentorshipSession: build.mutation({
      query: ({ id, scheduledAt, notes }) => ({ url: `/mentorships/${id}/sessions`, method: 'POST', body: { scheduledAt, notes } }),
      invalidatesTags: ['Mentorship'],
    }),
    getOpenReferralOffers: build.query({
      query: (params) => ({ url: '/referrals/offers', params }),
      providesTags: ['Referral'],
    }),
    getMyReferrals: build.query({
      query: () => ({ url: '/referrals' }),
      providesTags: ['Referral'],
    }),
    createReferralOffer: build.mutation({
      query: (body) => ({ url: '/referrals', method: 'POST', body }),
      invalidatesTags: ['Referral'],
    }),
    requestReferral: build.mutation({
      query: (id) => ({ url: `/referrals/${id}/request`, method: 'POST' }),
      invalidatesTags: ['Referral'],
    }),
    grantReferral: build.mutation({
      query: (id) => ({ url: `/referrals/${id}/grant`, method: 'PATCH' }),
      invalidatesTags: ['Referral'],
    }),
  }),
});

export const {
  useGetMentorsQuery,
  useGetMyMentorshipsQuery,
  useRequestMentorshipMutation,
  useUpdateMentorshipStatusMutation,
  useAddMentorshipSessionMutation,
  useGetOpenReferralOffersQuery,
  useGetMyReferralsQuery,
  useCreateReferralOfferMutation,
  useRequestReferralMutation,
  useGrantReferralMutation,
} = mentorshipApi;
