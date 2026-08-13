import { api } from './api.js';

/** Career roadmaps (spec §29). */
export const roadmapsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getRoadmaps: build.query({
      query: () => ({ url: '/roadmaps' }),
      providesTags: ['Roadmap'],
    }),
    getRoadmap: build.query({
      query: (role) => ({ url: `/roadmaps/${role}` }),
      providesTags: (result, _error, role) => [{ type: 'Roadmap', id: role }],
    }),
  }),
});

export const { useGetRoadmapsQuery, useGetRoadmapQuery } = roadmapsApi;
