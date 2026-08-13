import { api } from './api.js';

/** Study resources (spec §15). */
export const resourcesApi = api.injectEndpoints({
  endpoints: (build) => ({
    getResources: build.query({
      query: (params) => ({ url: '/resources', params }),
      providesTags: ['Resource'],
    }),
    getResource: build.query({
      query: (id) => ({ url: `/resources/${id}` }),
      providesTags: (result, _error, id) => [{ type: 'Resource', id }],
    }),
    getBookmarkedResources: build.query({
      query: () => ({ url: '/resources/bookmarks' }),
      providesTags: ['Resource'],
    }),
    getResourceCategories: build.query({
      query: () => ({ url: '/resources/categories' }),
    }),
    createResource: build.mutation({
      query: (body) => ({ url: '/resources', method: 'POST', body }),
      invalidatesTags: ['Resource', 'Dashboard'],
    }),
    updateResource: build.mutation({
      query: ({ id, body }) => ({ url: `/resources/${id}`, method: 'PUT', body }),
      invalidatesTags: (result, _error, arg) => [{ type: 'Resource', id: arg.id }, 'Resource'],
    }),
    deleteResource: build.mutation({
      query: (id) => ({ url: `/resources/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Resource', 'Dashboard'],
    }),
    rateResource: build.mutation({
      query: ({ id, rating }) => ({ url: `/resources/${id}/rate`, method: 'POST', body: { rating } }),
      invalidatesTags: (result, _error, arg) => [{ type: 'Resource', id: arg.id }, 'Resource'],
    }),
    bookmarkResource: build.mutation({
      query: (resourceId) => ({ url: '/resources/bookmark', method: 'POST', body: { resourceId } }),
      invalidatesTags: ['Resource'],
    }),
    unbookmarkResource: build.mutation({
      query: (resourceId) => ({ url: '/resources/bookmark', method: 'DELETE', body: { resourceId } }),
      invalidatesTags: ['Resource'],
    }),
    downloadResource: build.mutation({
      query: (id) => ({ url: `/resources/${id}/download`, method: 'POST' }),
      invalidatesTags: (result, _error, id) => [{ type: 'Resource', id }],
    }),
    reportResource: build.mutation({
      query: ({ id, body }) => ({ url: `/resources/${id}/report`, method: 'POST', body }),
    }),
    moderateResource: build.mutation({
      query: ({ id, status }) => ({ url: `/resources/${id}/moderate`, method: 'PUT', body: { status } }),
      invalidatesTags: (result, _error, arg) => [{ type: 'Resource', id: arg.id }, 'Resource'],
    }),
  }),
});

export const {
  useGetResourcesQuery,
  useGetResourceQuery,
  useGetBookmarkedResourcesQuery,
  useGetResourceCategoriesQuery,
  useCreateResourceMutation,
  useUpdateResourceMutation,
  useDeleteResourceMutation,
  useRateResourceMutation,
  useBookmarkResourceMutation,
  useUnbookmarkResourceMutation,
  useDownloadResourceMutation,
  useReportResourceMutation,
  useModerateResourceMutation,
} = resourcesApi;
