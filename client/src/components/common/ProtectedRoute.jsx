import { Navigate, Outlet, useLocation } from "react-router-dom";

import useAuth from "../../hooks/useAuth";
import { ROLES } from "../../data/demoUsers";
import { getHomePath, resolveRedirect } from "../../utils/authRedirect";

/**
 * Guard for pages that need a signed-in user. Use it as a layout route:
 *
 *   <Route element={<ProtectedRoute />}>             // travelers only
 *     <Route path="dashboard" element={<DashboardLayout />}> ... </Route>
 *   </Route>
 *
 *   <Route element={<ProtectedRoute role="admin" />}> // admins only
 *     <Route path="admin" element={<AdminLayout />}> ... </Route>
 *   </Route>
 *
 * Behaviour
 *  - Not signed in  -> /login, remembering the full address the visitor
 *                      wanted (path + ?query + #hash) in router state
 *  - Wrong role     -> the correct home for that role (admin -> /admin,
 *                      traveler -> /dashboard), never a blank page
 *  - Allowed        -> renders the nested routes
 *
 * `role` defaults to "user".
 */
export function ProtectedRoute({ role = ROLES.user }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user.role !== role) {
    return <Navigate to={getHomePath(user)} replace />;
  }

  return <Outlet />;
}

/**
 * Guard for pages that only make sense when signed OUT (login, register).
 * A signed-in visitor is sent on to where they were headed, or to their
 * dashboard.
 *
 *   <Route element={<GuestRoute />}>
 *     <Route path="login" element={<Login />} />
 *     <Route path="register" element={<Register />} />
 *   </Route>
 */
export function GuestRoute() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isAuthenticated) {
    return (
      <Navigate to={resolveRedirect(location.state?.from, user)} replace />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;