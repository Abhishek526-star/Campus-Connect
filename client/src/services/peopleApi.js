import { api } from './api.js';

/** People directory + connections (spec §6). */
export const peopleApi = api.injectEndpoints({
  endpoints: (build) => ({
    getDirectory: build.query({
      query: (params) => ({ url: '/people', params }),
      providesTags: ['Connection'],
    }),
    getConnections: build.query({
      query: (params) => ({ url: '/connections', params }),
      providesTags: ['Connection'],
    }),
    getConnectionRequests: build.query({
      query: () => ({ url: '/connections/requests' }),
      providesTags: ['Connection'],
    }),
    getOutgoingRequests: build.query({
      query: () => ({ url: '/connections/requests/outgoing' }),
      providesTags: ['Connection'],
    }),
    getSuggestions: build.query({
      query: (params) => ({ url: '/connections/suggestions', params }),
      providesTags: ['Connection'],
    }),
    sendConnectionRequest: build.mutation({
      query: (body) => ({ url: '/connections/request', method: 'POST', body }),
      invalidatesTags: ['Connection'],
    }),
    acceptConnectionRequest: build.mutation({
      query: (id) => ({ url: `/connections/${id}/accept`, method: 'PUT' }),
      invalidatesTags: ['Connection'],
    }),
    rejectConnectionRequest: build.mutation({
      query: (id) => ({ url: `/connections/${id}/reject`, method: 'PUT' }),
      invalidatesTags: ['Connection'],
    }),
    cancelConnectionRequest: build.mutation({
      query: (id) => ({ url: `/connections/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Connection'],
    }),
    removeConnection: build.mutation({
      query: (id) => ({ url: `/connections/${id}/remove`, method: 'DELETE' }),
      invalidatesTags: ['Connection'],
    }),
  }),
});

export const {
  useGetDirectoryQuery,
  useGetConnectionsQuery,
  useGetConnectionRequestsQuery,
  useGetOutgoingRequestsQuery,
  useGetSuggestionsQuery,
  useSendConnectionRequestMutation,
  useAcceptConnectionRequestMutation,
  useRejectConnectionRequestMutation,
  useCancelConnectionRequestMutation,
  useRemoveConnectionMutation,
} = peopleApi;
