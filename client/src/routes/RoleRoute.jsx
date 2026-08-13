import { Navigate, Outlet } from 'react-router';
import { useSelector } from 'react-redux';

/**
 * Role guard: renders the outlet only when the current user's role is in `roles`.
 */
export function RoleRoute({ roles = [] }) {
  const user = useSelector((state) => state.auth.user);

  if (!roles.includes(user?.role)) {
    return <Navigate to="/403" replace />;
  }
  return <Outlet />;
}
