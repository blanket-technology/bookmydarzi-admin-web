import { getStoredUser, getStoredPermissions } from "../../auth/store/authStore.js";
import { ROLES } from "../../../constants/permissions.js";
import AdminOpsDashboard from "../components/AdminOpsDashboard.jsx";
import EmployeeDashboard from "../components/EmployeeDashboard.jsx";
import SuperadminDashboard from "../components/SuperadminDashboard.jsx";
import TailorDashboard from "../components/TailorDashboard.jsx";

export default function useDashboard() {
  const user = getStoredUser();
  const role = (user?.Role || "").toLowerCase();
  const permissions = getStoredPermissions();

  const hasAccess = Boolean(permissions.dashboard);

  const DashboardView = (() => {
    if (!hasAccess) return null;
    if (role === ROLES.SUPERADMIN) return SuperadminDashboard;
    if (role === ROLES.EMPLOYEE) return EmployeeDashboard;
    if (role === ROLES.TAILOR) return TailorDashboard;
    return AdminOpsDashboard;
  })();

  return { hasAccess, DashboardView, role };
}
