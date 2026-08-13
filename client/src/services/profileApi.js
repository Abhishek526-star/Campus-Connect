import { api } from './api.js';

/** Profile endpoints (spec §4, §41). */
export const profileApi = api.injectEndpoints({
  endpoints: (build) => ({
    getMyProfile: build.query({
      query: () => ({ url: '/users/me' }),
      providesTags: ['Profile'],
    }),
    getPublicProfile: build.query({
      query: (id) => ({ url: `/users/${id}` }),
      providesTags: ['Profile'],
    }),
    updateBasics: build.mutation({
      query: (body) => ({ url: '/users/me', method: 'PATCH', body }),
      invalidatesTags: ['Profile', 'Auth'],
    }),
    updateRoleProfile: build.mutation({
      query: (body) => ({ url: '/users/me/role-profile', method: 'PATCH', body }),
      invalidatesTags: ['Profile'],
    }),
    updatePrivacy: build.mutation({
      query: (body) => ({ url: '/users/me/privacy', method: 'PATCH', body }),
      invalidatesTags: ['Profile'],
    }),
    uploadAvatar: build.mutation({
      query: (formData) => ({
        url: '/users/me/avatar?use=avatar',
        method: 'PATCH',
        body: formData, // FormData — fetchBaseQuery sets the multipart boundary
      }),
      invalidatesTags: ['Profile', 'Auth'],
    }),
  }),
});

export const {
  useGetMyProfileQuery,
  useGetPublicProfileQuery,
  useUpdateBasicsMutation,
  useUpdateRoleProfileMutation,
  useUpdatePrivacyMutation,
  useUploadAvatarMutation,
} = profileApi;
