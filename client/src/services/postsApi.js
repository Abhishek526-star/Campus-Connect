import { api } from './api.js';

/** Community feed (spec §16). */
export const postsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getPosts: build.query({
      query: (params) => ({ url: '/posts', params }),
      providesTags: ['Post'],
    }),
    getPost: build.query({
      query: (id) => ({ url: `/posts/${id}` }),
      providesTags: (result, _error, id) => [{ type: 'Post', id }],
    }),
    createPost: build.mutation({
      query: (body) => ({ url: '/posts', method: 'POST', body }),
      invalidatesTags: ['Post', 'Dashboard'],
    }),
    updatePost: build.mutation({
      query: ({ id, body }) => ({ url: `/posts/${id}`, method: 'PUT', body }),
      invalidatesTags: (result, _error, arg) => [{ type: 'Post', id: arg.id }, 'Post'],
    }),
    deletePost: build.mutation({
      query: (id) => ({ url: `/posts/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Post', 'Dashboard'],
    }),
    likePost: build.mutation({
      query: (id) => ({ url: `/posts/${id}/like`, method: 'POST' }),
      invalidatesTags: (result, _error, id) => [{ type: 'Post', id }],
    }),
    unlikePost: build.mutation({
      query: (id) => ({ url: `/posts/${id}/like`, method: 'DELETE' }),
      invalidatesTags: (result, _error, id) => [{ type: 'Post', id }],
    }),
    getComments: build.query({
      query: ({ postId, page = 1, limit = 20 }) => ({ url: `/posts/${postId}/comments`, params: { page, limit } }),
      providesTags: (result, _error, arg) => [{ type: 'Comment', id: arg.postId }],
    }),
    addComment: build.mutation({
      query: ({ postId, content, parentId }) => ({ url: `/posts/${postId}/comments`, method: 'POST', body: { content, parentId } }),
      invalidatesTags: (result, _error, arg) => [{ type: 'Comment', id: arg.postId }, { type: 'Post', id: arg.postId }],
    }),
    deleteComment: build.mutation({
      query: (commentId) => ({ url: `/posts/comments/${commentId}`, method: 'DELETE' }),
      invalidatesTags: ['Post', 'Comment'],
    }),
    savePost: build.mutation({
      query: (id) => ({ url: `/posts/${id}/save`, method: 'POST' }),
      invalidatesTags: (result, _error, id) => [{ type: 'Post', id }],
    }),
    unsavePost: build.mutation({
      query: (id) => ({ url: `/posts/${id}/save`, method: 'DELETE' }),
      invalidatesTags: (result, _error, id) => [{ type: 'Post', id }],
    }),
    sharePost: build.mutation({
      query: (id) => ({ url: `/posts/${id}/share`, method: 'POST' }),
      invalidatesTags: (result, _error, id) => [{ type: 'Post', id }],
    }),
    reportPost: build.mutation({
      query: ({ id, body }) => ({ url: `/posts/${id}/report`, method: 'POST', body }),
    }),
  }),
});

export const {
  useGetPostsQuery,
  useGetPostQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useLikePostMutation,
  useUnlikePostMutation,
  useGetCommentsQuery,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useSavePostMutation,
  useUnsavePostMutation,
  useSharePostMutation,
  useReportPostMutation,
} = postsApi;
