import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import uiReducer from './slices/uiSlice.js';
import notificationsReducer from './slices/notificationSlice.js';
import { api } from '../services/api.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    notifications: notificationsReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Blob-returning download endpoints (reports, attendance exports,
        // receipts) legitimately hold Blobs in mutation results.
        ignoredActions: ['api/executeMutation/fulfilled'],
        ignoredPaths: ['api.mutations'],
      },
    }).concat(api.middleware),
});
