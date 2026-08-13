import { api } from './api.js';

/** Chat endpoints (spec §7, §23). */
export const chatApi = api.injectEndpoints({
  endpoints: (build) => ({
    getConversations: build.query({
      query: () => ({ url: '/conversations' }),
      providesTags: ['Conversation'],
    }),
    searchConversations: build.query({
      query: (q) => ({ url: '/conversations/search', params: { q } }),
    }),
    getDirectConversation: build.mutation({
      query: (userId) => ({ url: '/conversations/direct', method: 'POST', body: { userId } }),
      invalidatesTags: ['Conversation'],
    }),
    getMessages: build.query({
      query: ({ conversationId, page = 1, limit = 30 }) => ({
        url: `/messages/${conversationId}`,
        params: { page, limit },
      }),
      providesTags: (result, _error, arg) => [{ type: 'Message', id: arg.conversationId }],
    }),
    sendMessageRest: build.mutation({
      query: (body) => ({ url: '/messages', method: 'POST', body }),
      invalidatesTags: (_result, _error, arg) => [{ type: 'Message', id: arg.conversationId }, 'Conversation'],
    }),
    markMessagesRead: build.mutation({
      query: ({ conversationId, messageIds }) => ({
        url: `/messages/${conversationId}/read`,
        method: 'PATCH',
        body: { messageIds },
      }),
    }),
    deleteMessage: build.mutation({
      query: (messageId) => ({ url: `/messages/${messageId}`, method: 'DELETE' }),
      invalidatesTags: ['Conversation'],
    }),
    uploadChatFile: build.mutation({
      query: (formData) => ({
        url: '/upload?use=chat',
        method: 'POST',
        body: formData,
      }),
    }),
    blockUser: build.mutation({
      query: (userId) => ({ url: '/conversations/block', method: 'POST', body: { userId } }),
      invalidatesTags: ['Conversation'],
    }),
    unblockUser: build.mutation({
      query: (userId) => ({ url: '/conversations/block', method: 'DELETE', body: { userId } }),
      invalidatesTags: ['Conversation'],
    }),
    reportUser: build.mutation({
      query: (body) => ({ url: '/conversations/report', method: 'POST', body }),
    }),
  }),
});

export const {
  useGetConversationsQuery,
  useSearchConversationsQuery,
  useGetDirectConversationMutation,
  useGetMessagesQuery,
  useSendMessageRestMutation,
  useMarkMessagesReadMutation,
  useDeleteMessageMutation,
  useUploadChatFileMutation,
  useBlockUserMutation,
  useUnblockUserMutation,
  useReportUserMutation,
} = chatApi;
