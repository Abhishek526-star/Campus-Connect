import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  accessToken: null,
  status: 'idle', // idle (bootstrap) | authenticated | unauthenticated
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action) {
      state.user = action.payload.user ?? state.user;
      state.accessToken = action.payload.accessToken ?? state.accessToken;
      state.status = 'authenticated';
    },
    setAccessToken(state, action) {
      state.accessToken = action.payload;
    },
    setUser(state, action) {
      state.user = action.payload;
    },
    authFailed(state) {
      state.status = 'unauthenticated';
    },
    loggedOut(state) {
      state.user = null;
      state.accessToken = null;
      state.status = 'unauthenticated';
    },
  },
});

export const { setCredentials, setAccessToken, setUser, authFailed, loggedOut } = authSlice.actions;
export default authSlice.reducer;
