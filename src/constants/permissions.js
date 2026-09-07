/**
 * Role-based access control for the BMD-Admin panel.
 *
 * Source of truth: the backend's actual per-endpoint role gates (see
 * app/core/rbac.py require_admin/require_roles, and the individual endpoint
 * files under app/api/v1/endpoints/). Every module below is only granted to
 * a role if the underlying API that module calls actually authorizes that
 * role - this file must never grant a role more UI access than the backend
 * would accept from it.
 *
 * Fail-closed: an unresolvable/unknown role gets NO_PERMISSIONS, never full
 * access. An unmapped route is denied, never silently allowed.
 */

export const ROLES = {
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  EMPLOYEE: "employee",
  TAILOR: "tailor",
};

// Every gated module in the app. Keys are used both as permission flags and
// (via ROUTE_PERMISSION_MAP below) to protect routes.
export const MODULES = {
  DASHBOARD: "dashboard",
  REVENUE_ANALYTICS: "revenueAnalytics", // GET /admin/dashboard revenue/analytics fields - superadmin-only in the UI
  FINANCIAL_REPORTS: "financialReports", // Reporting page - superadmin-only in the UI
  PAYMENTS: "payments", // GET /payments/order/{id} etc. - everyone can view, scope differs (see PAYMENT_SCOPE)
  COD_COLLECTION: "codCollection", // POST /employee/orders/{id}/collect-payment - employee only
  USERS: "users", // /admin/users - require_admin
  EMPLOYEES: "employees", // Bridge - require_admin
  TAILORS: "tailors", // /admin/tailors - require_admin
  ORDERS: "orders", // /admin/orders (admin/superadmin/employee) or /orders/my-orders (tailor)
  CMS: "cms", // /admin/homepage/* - require_admin
  COUPONS: "coupons", // /admin/homepage/offers - require_admin
  NOTIFICATIONS: "notifications", // /notifications - get_current_user, every role
  CHAT_SUPPORT: "chatSupport", // chat_v2 admin router - admin/superadmin/employee
  SUPPORT_FAQS: "supportFaqs", // /support/faqs admin CRUD - require_admin
  SUPPORT_TICKETS: "supportTickets", // ticketing - admin/superadmin/employee
  CANCELLATIONS: "cancellations", // admin/superadmin/employee
  LEAVE_REQUESTS: "leaveRequests", // /admin/leave-requests - require_admin. Tailor/Bridge submit from
  // their own mobile app, not here - this is the admin review screen only.
  SERVICE_AREAS: "serviceAreas", // /location/admin/service-areas - require_roles(ADMIN, SUPERADMIN)
  LOOKBOOK: "lookbook", // catalog-adjacent - require_admin
  CATALOG: "catalog", // require_admin
  AUDIT_LOG: "auditLog", // GET /admin/audit-logs - require_admin
  ROLES_PERMISSIONS: "rolesPermissions", // staff role management - superadmin-only in the UI
  SYSTEM_CONFIG: "systemConfig", // GET/PATCH /admin/settings/billing - backend allows admin+superadmin,
  // restricted to superadmin-only in the UI per product decision (see below)
  MY_ACCOUNT: "myAccount", // every role manages their own profile
  INVENTORY: "inventory", // /inventory CRUD - admin/superadmin/employee (require_admin_permission)
  FLEET_TRACKING: "fleetTracking", // Deliveries/Pickups admin pages - GET /admin/orders (require_admin_orders)
};

const ALL_FALSE = Object.fromEntries(Object.values(MODULES).map((m) => [m, false]));

const SUPERADMIN_PERMISSIONS = {
  ...ALL_FALSE,
  dashboard: true,
  revenueAnalytics: true,
  financialReports: true,
  payments: true,
  codCollection: true, // view only, gated further at the action level (see PAYMENT_ACTIONS)
  users: true,
  employees: true,
  tailors: true,
  orders: true,
  cms: true,
  coupons: true,
  notifications: true,
  chatSupport: true,
  supportFaqs: true,
  supportTickets: true,
  cancellations: true,
  leaveRequests: true,
  serviceAreas: true,
  lookbook: true,
  catalog: true,
  auditLog: true,
  rolesPermissions: true,
  systemConfig: true,
  myAccount: true,
  inventory: true,
  fleetTracking: true,
};

// Admin is an OPERATIONS admin, not a business/finance admin - no revenue,
// profit, finance, or business-analytics visibility. Product decision.
const ADMIN_PERMISSIONS = {
  ...ALL_FALSE,
  dashboard: true,
  revenueAnalytics: false,
  financialReports: false,
  payments: true,
  codCollection: true, // view only
  users: true,
  employees: true,
  tailors: true,
  orders: true,
  cms: true,
  coupons: true,
  notifications: true,
  chatSupport: true,
  supportFaqs: true,
  supportTickets: true,
  cancellations: true,
  leaveRequests: true,
  serviceAreas: true,
  lookbook: true,
  catalog: true,
  auditLog: true,
  rolesPermissions: false,
  systemConfig: false, // backend allows admin too (require_admin) - hidden here by product decision
  myAccount: true,
  inventory: true,
  fleetTracking: true,
};

const EMPLOYEE_PERMISSIONS = {
  ...ALL_FALSE,
  dashboard: true,
  orders: true, // scoped to assigned orders - see ORDER_SCOPE
  payments: true, // scoped to assigned orders - see PAYMENT_SCOPE
  codCollection: true, // the only role that can actually collect
  notifications: true,
  chatSupport: true,
  supportTickets: true,
  cancellations: false, // hidden from Bridge/employee UI by product decision - backend/API logic untouched
  myAccount: true,
  inventory: true, // backend allows EMPLOYEE for inventory mutations too
  fleetTracking: false, // fleet-wide view is an ops/admin oversight tool, not an individual employee's own-job feed (that's the mobile app's Deliveries/Pickups broadcast screens)
};

const TAILOR_PERMISSIONS = {
  ...ALL_FALSE,
  dashboard: true,
  orders: true, // scoped to own orders - see ORDER_SCOPE
  payments: true, // read-only, own orders - see PAYMENT_SCOPE
  notifications: true,
  myAccount: true,
};

// Most restrictive default - used when the role cannot be resolved at all.
const NO_PERMISSIONS = { ...ALL_FALSE };

const PERMISSIONS_BY_ROLE = {
  [ROLES.SUPERADMIN]: SUPERADMIN_PERMISSIONS,
  [ROLES.ADMIN]: ADMIN_PERMISSIONS,
  [ROLES.EMPLOYEE]: EMPLOYEE_PERMISSIONS,
  [ROLES.TAILOR]: TAILOR_PERMISSIONS,
};

/** Data-scoping hints for pages that show the same module but different data per role. */
export const ORDER_SCOPE = {
  [ROLES.SUPERADMIN]: "all",
  [ROLES.ADMIN]: "all",
  [ROLES.EMPLOYEE]: "assigned",
  [ROLES.TAILOR]: "own",
};

export const PAYMENT_SCOPE = {
  [ROLES.SUPERADMIN]: "all",
  [ROLES.ADMIN]: "all",
  [ROLES.EMPLOYEE]: "assigned",
  [ROLES.TAILOR]: "own",
};

/** Whether a role can perform mutating payment actions (refund / status override), vs. view only. */
export const PAYMENT_ACTIONS_ALLOWED = {
  [ROLES.SUPERADMIN]: true,
  [ROLES.ADMIN]: true,
  [ROLES.EMPLOYEE]: false,
  [ROLES.TAILOR]: false,
};

const normalizeRole = (role) => {
  if (!role) return undefined;
  const value = String(role).toLowerCase().trim();
  return value.length > 0 ? value : undefined;
};

/** Resolve a role string (any case) to its permission set. Fail-closed on anything unrecognized. */
export function resolvePermissions(role) {
  const normalized = normalizeRole(role);
  if (!normalized) return NO_PERMISSIONS;
  return PERMISSIONS_BY_ROLE[normalized] ?? NO_PERMISSIONS;
}

export function getOrderScope(role) {
  return ORDER_SCOPE[normalizeRole(role)] ?? "own";
}

export function getPaymentScope(role) {
  return PAYMENT_SCOPE[normalizeRole(role)] ?? "own";
}

export function canManagePayments(role) {
  return PAYMENT_ACTIONS_ALLOWED[normalizeRole(role)] ?? false;
}

/**
 * Merges a role's default module access with this specific account's
 * per-account overrides (see AdminAccessSection.jsx / RBAC_USER_SCREEN_PERMISSIONS
 * on the backend). Mirrors the backend's coarse screen-level gate
 * (require_admin_permission / has_any_active_revoke_for_screen): an L1
 * superadmin revoking ANY permission on a screen for this account hides
 * that module's route/nav entirely for them, regardless of role default.
 *
 * `effective` is the GET /rbac/user-permissions/{id}/effective response.
 * RBAC screen_name values are already the same strings as MODULES values
 * (e.g. "cms", "catalog"), so this is a direct key match - no separate
 * screen->module map needed.
 */
export function mergeEffectivePermissions(role, effective) {
  const base = { ...resolvePermissions(role) };
  if (!effective) return base;
  const revokedScreens = new Set(
    (effective.explicit_revokes || []).map((r) => r.screen_name)
  );
  for (const screenName of revokedScreens) {
    if (screenName in base) base[screenName] = false;
  }
  return base;
}

/**
 * Maps a route path to the module it belongs to. A route missing from this
 * map is denied by default (fail-closed) - see ProtectedRoute.jsx. Every
 * route declared in App.jsx must have an entry here.
 */
export const ROUTE_PERMISSION_MAP = {
  "/dashboard": MODULES.DASHBOARD,
  "/users": MODULES.USERS,
  "/customers/:id": MODULES.USERS,
  "/bridgedetail": MODULES.EMPLOYEES,
  "/addbridge": MODULES.EMPLOYEES,
  "/employee-order-workflow/:id": MODULES.EMPLOYEES,
  "/employees/:id": MODULES.EMPLOYEES,
  "/tailordetails": MODULES.TAILORS,
  "/addtailor": MODULES.TAILORS,
  "/tailors/:id": MODULES.TAILORS,
  "/tailor-applications": MODULES.TAILORS,
  "/ordersdetails": MODULES.ORDERS,
  "/addorder": MODULES.ORDERS,
  "/orders/:id": MODULES.ORDERS,
  // Kept registered (route still exists in App.jsx for any stale deep
  // links) even though Layout.jsx no longer links to it - removed from nav
  // per product decision (order management/queue overlap resolved by
  // keeping only Order Management, and Payments/Cancellations no longer
  // need their own top-level nav entries).
  "/payments": MODULES.PAYMENTS,
  "/catalog": MODULES.CATALOG,
  "/reporting": MODULES.FINANCIAL_REPORTS,
  "/offers": MODULES.COUPONS,
  "/notifications": MODULES.NOTIFICATIONS,
  "/cms": MODULES.CMS, // Categories/Banners/FAQ/Lookbook, all in one page now
  "/settings": MODULES.MY_ACCOUNT, // Settings page internally gates its own Billing tab
  "/profile": MODULES.MY_ACCOUNT, // standalone profile page - primarily for Bridge/employee, who lack the rest of Settings
  "/cancellations": MODULES.CANCELLATIONS,
  "/leave-requests": MODULES.LEAVE_REQUESTS,
  "/service-areas": MODULES.SERVICE_AREAS,
  "/support": MODULES.SUPPORT_TICKETS, // merged tickets+chat - gated same as the ticketing module it absorbed
  // Kept registered (routes still exist in App.jsx for any stale deep
  // links) even though Layout.jsx no longer links to them directly.
  "/chat-support": MODULES.CHAT_SUPPORT,
  "/faqs": MODULES.SUPPORT_FAQS,
  "/support-tickets": MODULES.SUPPORT_TICKETS,
  "/inventory": MODULES.INVENTORY,
  "/deliveries": MODULES.FLEET_TRACKING,
  "/pickups": MODULES.FLEET_TRACKING,
};

// Matches a concrete pathname (e.g. "/customers/42") against a route pattern
// that may contain ":id"-style dynamic segments (e.g. "/customers/:id").
function pathMatchesPattern(pathname, pattern) {
  const pathParts = pathname.split("/").filter(Boolean);
  const patternParts = pattern.split("/").filter(Boolean);
  if (pathParts.length !== patternParts.length) return false;
  return patternParts.every((part, i) => part.startsWith(":") || part === pathParts[i]);
}

/** True if `permissions` grants access to the module mapped to `pathname`.
 * Fail-closed - checks both literal routes and dynamic (":id") ones, since
 * a plain exact-match lookup would reject every real detail-page URL
 * (e.g. "/customers/42" never equals the map's "/customers/:id" key). */
export function canAccessPath(pathname, permissions) {
  const moduleKey =
    ROUTE_PERMISSION_MAP[pathname] ??
    Object.entries(ROUTE_PERMISSION_MAP).find(([pattern]) =>
      pathMatchesPattern(pathname, pattern)
    )?.[1];
  if (!moduleKey) return false;
  return Boolean(permissions[moduleKey]);
}

/** First module a role has access to, in priority order - used to redirect after login. */
const DEFAULT_ROUTE_PRIORITY = [
  ["dashboard", "/dashboard"],
  ["orders", "/ordersdetails"],
  ["myAccount", "/settings"],
];

export function getDefaultRouteForRole(role) {
  const permissions = resolvePermissions(role);
  for (const [key, path] of DEFAULT_ROUTE_PRIORITY) {
    if (permissions[key]) return path;
  }
  // No module accessible at all - this role has no legitimate destination
  // in this app. Do not fall back to a route inside the authenticated app
  // (would just bounce straight back out); send to login instead.
  return "/";
}
