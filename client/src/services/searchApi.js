import { api } from './api.js';

/** Global search (spec §19). */
export const searchApi = api.injectEndpoints({
  endpoints: (build) => ({
    globalSearch: build.query({
      query: (params) => ({ url: '/search', params }),
    }),
  }),
});

export const { useGlobalSearchQuery } = searchApi;
