import { api } from './api.js';
import { setAccessToken, setCredentials, loggedOut } from '../store/slices/authSlice.js';

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    register: build.mutation({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    verifyEmail: build.mutation({
      query: (body) => ({ url: '/auth/verify-email', method: 'POST', body }),
    }),
    resendVerification: build.mutation({
      query: (body) => ({ url: '/auth/resend-verification', method: 'POST', body }),
    }),
    login: build.mutation({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      onQueryStarted: async (_args, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials({ user: data.data.user, accessToken: data.data.accessToken }));
        } catch {
          // handled by the caller
        }
      },
    }),
    googleLogin: build.mutation({
      query: (body) => ({ url: '/auth/google', method: 'POST', body }),
      onQueryStarted: async (_args, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials({ user: data.data.user, accessToken: data.data.accessToken }));
        } catch {
          // handled by the caller
        }
      },
    }),
    refresh: build.mutation({
      query: () => ({ url: '/auth/refresh', method: 'POST' }),
      onQueryStarted: async (_args, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          dispatch(setAccessToken(data.data.accessToken));
          // Hydrate the user profile for guards and role-aware UI.
          try {
            const me = await dispatch(authApi.endpoints.me.initiate()).unwrap();
            dispatch(setCredentials({ user: me.data.user, accessToken: data.data.accessToken }));
          } catch {
            dispatch(setCredentials({ accessToken: data.data.accessToken }));
          }
        } catch {
          dispatch(loggedOut());
        }
      },
    }),
    logout: build.mutation({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      onQueryStarted: async (_args, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled;
        } catch {
          // server-side revoke may have failed; still clear local state
        }
        dispatch(loggedOut());
        dispatch(api.util.resetApiState());
      },
    }),
    me: build.query({
      query: () => ({ url: '/auth/me' }),
      providesTags: ['Auth'],
    }),
    forgotPassword: build.mutation({
      query: (body) => ({ url: '/auth/forgot-password', method: 'POST', body }),
    }),
    resetPassword: build.mutation({
      query: (body) => ({ url: '/auth/reset-password', method: 'POST', body }),
    }),
    changePassword: build.mutation({
      query: (body) => ({ url: '/auth/change-password', method: 'PATCH', body }),
      invalidatesTags: ['Auth'],
    }),
  }),
});

export const {
  useRegisterMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
  useLoginMutation,
  useGoogleLoginMutation,
  useRefreshMutation,
  useLogoutMutation,
  useMeQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
} = authApi;
