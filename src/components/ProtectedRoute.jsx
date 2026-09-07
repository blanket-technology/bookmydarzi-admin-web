import { Navigate, Outlet, useLocation } from "react-router-dom";
import { canAccessPath, getDefaultRouteForRole } from "../constants/permissions";
import { getStoredUser, getStoredPermissions } from "../store/authStore";

function ProtectedRoute() {
  const location = useLocation();
  const token = sessionStorage.getItem("access_token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  const user = getStoredUser();
  const permissions = getStoredPermissions();

  // Fail-closed: a route not in ROUTE_PERMISSION_MAP, or a role this app has
  // no module for at all, is denied - never silently allowed.
  if (!canAccessPath(location.pathname, permissions)) {
    const fallback = getDefaultRouteForRole(user?.Role);
    // getDefaultRouteForRole returning "/" means this role has no accessible
    // module anywhere in the app (e.g. a plain customer account signed in
    // here by mistake) - there is no safe destination inside the app to
    // send them to, so this must end the session, not just redirect within
    // it (redirecting to another in-app route would just repeat this same
    // check and fail again).
    if (fallback === "/") {
      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("refresh_token");
      sessionStorage.removeItem("user");
    }
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;