import {
  User, IndianRupee, Shield, ShieldCheck, ClipboardList,
} from "lucide-react";
import { MODULES } from "../../../constants/permissions.js";

export const ACCORDION_GROUPS = [
  {
    id: "account_group",
    label: "My Account",
    items: [
      { id: "account", label: "My Profile", icon: User, module: null },
      { id: "roles", label: "Roles & Permissions", icon: Shield, module: MODULES.ROLES_PERMISSIONS },
      { id: "admin_access", label: "Admin Access", icon: ShieldCheck, module: MODULES.ROLES_PERMISSIONS },
      { id: "audit", label: "Audit Log", icon: ClipboardList, module: MODULES.AUDIT_LOG },
    ],
  },
  {
    id: "billing_group",
    label: "Billing",
    items: [
      { id: "billing", label: "Billing & Fees", icon: IndianRupee, module: MODULES.SYSTEM_CONFIG },
    ],
  },
];

export const ACTION_COLOR = {
  TAILOR_APPROVED: "bg-emerald-100 text-emerald-800",
  TAILOR_REJECTED: "bg-red-100 text-red-700",
  TAILOR_ASSIGNED_TO_ORDER: "bg-blue-100 text-blue-800",
  TAILOR_REASSIGNED: "bg-violet-100 text-violet-800",
  TAILOR_STATUS_CHANGED: "bg-amber-100 text-amber-800",
  TAILOR_APPLICATION_SUBMITTED: "bg-sky-100 text-sky-800",
};

export const AUDIT_PAGE_LIMIT = 20;

export const INPUT =
  "w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400";

export const SETTINGS_ENDPOINTS = {
  BILLING: "/admin/settings/billing",
  CACHE_CLEAR: "/admin/homepage/cache/clear",
  AUDIT_LOGS: "/admin/audit-logs",
  STAFF: "/admin/staff",
  RBAC_SCREENS: "/rbac/screens",
  RBAC_PERMISSIONS: "/rbac/permissions",
};
