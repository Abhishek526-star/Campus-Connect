import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  unreadCount: 0,
  latest: [], // newest notifications (fed by socket in real time)
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setUnreadCount(state, action) {
      state.unreadCount = action.payload;
    },
    prependNotification(state, action) {
      const notification = action.payload;
      if (!notification) return;
      // Avoid duplicates when the same notification arrives via socket + refetch.
      if (state.latest.some((item) => item._id === notification._id)) return;
      state.latest = [notification, ...state.latest].slice(0, 20);
      if (!notification.isRead) state.unreadCount += 1;
    },
    markAllRead(state) {
      state.unreadCount = 0;
      state.latest = state.latest.map((item) => ({ ...item, isRead: true }));
    },
    clearLatest(state) {
      state.latest = [];
      state.unreadCount = 0;
    },
  },
});

export const { setUnreadCount, prependNotification, markAllRead, clearLatest } = notificationSlice.actions;
export default notificationSlice.reducer;
