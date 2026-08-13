import { Navigate, Outlet } from 'react-router';
import { useSelector } from 'react-redux';
import { PageLoader } from '../components/common/PageLoader.jsx';

/**
 * Route guard for auth pages (login/register/forgot): already-authenticated
 * users are sent to the dashboard.
 */
export function PublicOnlyRoute() {
  const status = useSelector((state) => state.auth.status);

  if (status === 'idle' || status === 'loading') return <PageLoader />;
  if (status === 'authenticated') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
