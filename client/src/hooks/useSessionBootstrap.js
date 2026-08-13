import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useRefreshMutation } from '../services/authApi.js';
import { authFailed } from '../store/slices/authSlice.js';

/**
 * Session bootstrap: attempts a refresh on first load.
 * - refresh cookie present → access token + user restored (session persists)
 * - no cookie → status becomes unauthenticated (redirect to login)
 */
export function useSessionBootstrap() {
  const dispatch = useDispatch();
  const [refresh] = useRefreshMutation();

  useEffect(() => {
    refresh()
      .unwrap()
      .catch(() => {
        // refresh failed or no cookie — no session
        dispatch(authFailed());
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
