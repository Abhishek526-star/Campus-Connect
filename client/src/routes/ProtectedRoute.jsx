import { Navigate, Outlet, useLocation } from 'react-router';
import { useSelector } from 'react-redux';
import { PageLoader } from '../components/common/PageLoader.jsx';

/**
 * Route guard: renders the page only for authenticated users.
 * Shows a loader during session bootstrap, otherwise redirects to /login.
 */
export function ProtectedRoute() {
  const status = useSelector((state) => state.auth.status);
  const location = useLocation();

  if (status === 'idle' || status === 'loading') return <PageLoader />;
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
