/**
 * Centralized order workflow action resolver.
 *
 * Mirrors the backend's authoritative order-status machine
 * (app/constants/order_status.py + app/services/orders/order_status_rules.py +
 * app/services/orders/status_service.py `_ADMIN_BLOCKED`) so the admin panel
 * never renders an action button that the backend would reject.
 *
 * IMPORTANT: keep this the single source of truth for "what buttons can this
 * role press on this order right now" - pages must not hand-roll
 * `if (status === ...)` blocks; they call getOrderActions() and render
 * whatever comes back.
 *
 * Admins/superadmins bypass the transition graph server-side (see
 * assert_role_may_transition: `role in ADMIN_STAFF_ROLES: return`), but the
 * generic PATCH /admin/orders/{id}/status endpoint additionally rejects a
 * fixed set of statuses (_ADMIN_BLOCKED) because they're owned by dedicated
 * endpoints (broadcast system, cancel, employee delivery/complete). Those
 * dedicated endpoints are modeled below as their own action ids so the admin
 * panel can still trigger them - just via the correct endpoint.
 */

export const ORDER_STATUS = {
  PENDING_PAYMENT: "pending_payment",
  PAYMENT_FAILED: "payment_failed",
  ORDER_PLACED: "order_placed",
  ORDER_ACCEPTED: "order_accepted",
  ORDER_REJECTED: "order_rejected",
  SEARCHING_TAILOR: "searching_tailor",
  BROADCASTED: "broadcasted",
  TAILOR_ASSIGNED: "tailor_assigned",
  PICKUP_SCHEDULED: "pickup_scheduled",
  PICKUP_PENDING: "pickup_pending",
  PICKED_UP: "picked_up",
  CLOTH_RECEIVED_BY_TAILOR: "cloth_received_by_tailor",
  STITCHING_STARTED: "stitching_started",
  IN_PROGRESS: "in_progress",
  FINAL_CHECK: "final_check",
  READY_FOR_DISPATCH: "ready_for_dispatch",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export const STATUS_LABELS = {
  pending_payment: "Pending Payment",
  payment_failed: "Payment Failed",
  order_placed: "Order Placed",
  order_accepted: "Accepted",
  order_rejected: "Rejected",
  searching_tailor: "Searching Tailor",
  broadcasted: "Broadcasted",
  tailor_assigned: "Tailor Assigned",
  pickup_scheduled: "Pickup Scheduled",
  pickup_pending: "Pickup Pending",
  picked_up: "Cloth Collected",
  cloth_received_by_tailor: "Cloth Received by Tailor",
  stitching_started: "Stitching Started",
  in_progress: "Stitching In Progress",
  final_check: "Final Check",
  ready_for_dispatch: "Ready for Dispatch",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const TERMINAL_STATUSES = new Set(["completed", "cancelled", "order_rejected"]);

const ROLE = {
  ADMIN: "admin",
  SUPERADMIN: "superadmin",
  EMPLOYEE: "employee",
  TAILOR: "tailor",
};

function isAdminStaff(role) {
  return role === ROLE.ADMIN || role === ROLE.SUPERADMIN || role === ROLE.EMPLOYEE;
}

/**
 * Returns the list of action descriptors valid for the given role + order
 * (+ optional payment) combination.
 *
 * Each descriptor: { id, label, endpoint, method, requiresReason, requiresInput,
 *   variant, group }
 *   - endpoint may be a function(order) => path when it depends on order id.
 *   - `group`: "primary" | "danger" | "info" - for button styling by callers.
 */
export function getOrderActions(role, order, payment) {
  if (!order) return [];
  const status = (order.Status || "").toLowerCase();
  const remaining = Number(order.RemainingAmount ?? payment?.RemainingAmount ?? 0);
  const actions = [];

  if (TERMINAL_STATUSES.has(status)) {
    return actions; // no further actions on terminal orders, for anyone
  }

  const staff = isAdminStaff(role);

  // ── order_placed → accept / reject (employee dedicated endpoint; admin may also use generic status endpoint, but blocked-list forbids setting order_placed itself, not accepted/rejected, so route through employee endpoints uniformly for correctness + audit trail) ──
  if (status === ORDER_STATUS.ORDER_PLACED && (role === ROLE.EMPLOYEE || staff)) {
    actions.push({
      id: "accept",
      label: "Accept Order",
      endpoint: (o) => `/employee/orders/${o.Id}/accept`,
      method: "patch",
      group: "primary",
    });
    actions.push({
      id: "reject",
      label: "Reject Order",
      endpoint: (o) => `/employee/orders/${o.Id}/reject`,
      method: "patch",
      group: "danger",
      requiresReason: false,
    });
  }

  // ── order_accepted → schedule pickup (parallel to broadcast, which is automatic) ──
  if (status === ORDER_STATUS.ORDER_ACCEPTED && (role === ROLE.EMPLOYEE || staff)) {
    actions.push({
      id: "schedule_pickup_instant",
      label: "Schedule Pickup (Instant)",
      endpoint: (o) => `/employee/orders/${o.Id}/schedule-pickup`,
      method: "patch",
      body: { pickup_type: "instant" },
      group: "primary",
    });
    actions.push({
      id: "schedule_pickup_scheduled",
      label: "Schedule Pickup (Scheduled)",
      endpoint: (o) => `/employee/orders/${o.Id}/schedule-pickup`,
      method: "patch",
      requiresInput: ["scheduled_pickup_at", "pickup_time_slot"],
      bodyFromInput: (input) => ({
        pickup_type: "scheduled",
        scheduled_pickup_at: input.scheduled_pickup_at,
        pickup_time_slot: input.pickup_time_slot,
      }),
      group: "secondary",
    });
  }

  // ── tailor_assigned → schedule pickup (same parallel track as
  // order_accepted; schedule_pickup_employee_order accepts both statuses,
  // so an order can enter pickup as soon as a tailor is found even if it
  // was never scheduled right after acceptance) ──
  if (status === ORDER_STATUS.TAILOR_ASSIGNED && (role === ROLE.EMPLOYEE || staff)) {
    actions.push({
      id: "schedule_pickup_instant",
      label: "Schedule Pickup (Instant)",
      endpoint: (o) => `/employee/orders/${o.Id}/schedule-pickup`,
      method: "patch",
      body: { pickup_type: "instant" },
      group: "primary",
    });
    actions.push({
      id: "schedule_pickup_scheduled",
      label: "Schedule Pickup (Scheduled)",
      endpoint: (o) => `/employee/orders/${o.Id}/schedule-pickup`,
      method: "patch",
      requiresInput: ["scheduled_pickup_at", "pickup_time_slot"],
      bodyFromInput: (input) => ({
        pickup_type: "scheduled",
        scheduled_pickup_at: input.scheduled_pickup_at,
        pickup_time_slot: input.pickup_time_slot,
      }),
      group: "secondary",
    });
  }

  // ── pickup_pending / pickup_scheduled → confirm pickup ──
  if (
    (status === ORDER_STATUS.PICKUP_PENDING || status === ORDER_STATUS.PICKUP_SCHEDULED) &&
    (role === ROLE.EMPLOYEE || staff)
  ) {
    actions.push({
      id: "confirm_pickup",
      label: "Confirm Cloth Picked Up",
      endpoint: (o) => `/employee/orders/${o.Id}/pickup`,
      method: "patch",
      group: "primary",
    });
  }

  // ── picked_up → hand to tailor ──
  if (status === ORDER_STATUS.PICKED_UP && (role === ROLE.EMPLOYEE || staff)) {
    actions.push({
      id: "hand_to_tailor",
      label: "Hand Cloth to Tailor",
      endpoint: (o) => `/employee/orders/${o.Id}/hand-to-tailor`,
      method: "patch",
      group: "primary",
      disabledReason: !order.TailorId ? "Assign a tailor first" : null,
    });
  }

  // ── tailor stitching stages (tailor-only per TAILOR_ALLOWED_TARGETS) ──
  const STITCHING_NEXT = {
    [ORDER_STATUS.CLOTH_RECEIVED_BY_TAILOR]: {
      id: "stitching_started",
      label: "Start Stitching",
      target: ORDER_STATUS.STITCHING_STARTED,
    },
    [ORDER_STATUS.STITCHING_STARTED]: {
      id: "in_progress",
      label: "Mark In Progress",
      target: ORDER_STATUS.IN_PROGRESS,
    },
    [ORDER_STATUS.IN_PROGRESS]: {
      id: "final_check",
      label: "Move to Final Check",
      target: ORDER_STATUS.FINAL_CHECK,
    },
    [ORDER_STATUS.FINAL_CHECK]: {
      id: "ready_for_dispatch",
      label: "Mark Ready for Dispatch",
      target: ORDER_STATUS.READY_FOR_DISPATCH,
    },
  };
  if (role === ROLE.TAILOR && STITCHING_NEXT[status]) {
    const step = STITCHING_NEXT[status];
    actions.push({
      id: step.id,
      label: step.label,
      // Dedicated tailor status-transition endpoint (require_roles(TAILOR) +
      // assert_can_update_order_status - only the assigned tailor may call
      // this), NOT /admin/orders/{id}/status which rejects a tailor caller.
      endpoint: (o) => `/orders/${o.Id}/status`,
      method: "patch",
      body: { status: step.target },
      group: "primary",
    });
  }
  // Admin/superadmin/employee may all advance stitching stages themselves -
  // staff should be able to drive the full order lifecycle after a tailor is
  // assigned, not just the tailor (assert_role_may_transition bypasses the
  // transition graph for ADMIN_STAFF_ROLES, which includes EMPLOYEE, and the
  // generic PATCH /admin/orders/{id}/status endpoint now accepts EMPLOYEE too
  // - see app/api/v1/endpoints/admin.py's admin_update_order_status).
  if (staff && STITCHING_NEXT[status]) {
    const step = STITCHING_NEXT[status];
    actions.push({
      id: `force_${step.id}`,
      label: role === ROLE.EMPLOYEE ? step.label : `Force: ${step.label}`,
      endpoint: (o) => `/admin/orders/${o.Id}/status`,
      method: "patch",
      body: { status: step.target },
      group: "primary",
    });
  }

  // No manual "Mark Out for Delivery" action here - PATCH
  // /employee/orders/{id}/delivery is deprecated server-side and
  // unconditionally raises a ValidationException (employee_order_service.py's
  // delivery_employee_order). Once an order reaches READY_FOR_DISPATCH it
  // becomes a delivery-broadcast candidate automatically; the employee
  // claims it via PATCH /employee/orders/{id}/delivery-broadcast/accept
  // from their Deliveries queue, not a button here. See
  // OrderFullDetails.jsx's disabledReason handling for the explanatory note
  // shown in place of this action.

  // ── out_for_delivery → collect COD/balance payment (employee only, not tailor) ──
  if (status === ORDER_STATUS.OUT_FOR_DELIVERY && role === ROLE.EMPLOYEE && remaining > 0) {
    actions.push({
      id: "collect_payment",
      label: "Collect Balance Payment",
      endpoint: (o) => `/employee/orders/${o.Id}/collect-payment`,
      method: "post",
      requiresInput: ["method", "amount"],
      bodyFromInput: (input) => ({
        method: input.method,
        amount: Number(input.amount),
        notes: input.notes || undefined,
      }),
      group: "primary",
    });
  }

  // ── out_for_delivery → complete (employee/admin; hard payment gate enforced server-side) ──
  if (status === ORDER_STATUS.OUT_FOR_DELIVERY && (role === ROLE.EMPLOYEE || staff)) {
    actions.push({
      id: "complete_order",
      label: "Mark Delivered & Completed",
      endpoint: (o) => `/employee/orders/${o.Id}/complete`,
      method: "patch",
      group: "primary",
      disabledReason: remaining > 0 ? `Balance of ₹${remaining} must be collected first` : null,
    });
  }

  // ── assign tailor (admin/superadmin; employee via assign-tailor too, before terminal, no tailor yet) ──
  if (
    !order.TailorId &&
    ![ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.PAYMENT_FAILED].includes(status) &&
    staff
  ) {
    actions.push({
      id: "assign_tailor",
      label: "Assign Tailor",
      endpoint: (o) => `/admin/orders/${o.Id}/assign-tailor`,
      method: "patch",
      requiresInput: ["tailor_id"],
      bodyFromInput: (input) => ({ tailor_id: Number(input.tailor_id) }),
      group: "secondary",
    });
  }

  // ── cancel (admin/superadmin only via dedicated endpoint - _ADMIN_BLOCKED) ──
  if (staff && role !== ROLE.EMPLOYEE) {
    actions.push({
      id: "cancel_order",
      label: "Cancel Order",
      endpoint: (o) => `/admin/orders/${o.Id}/cancel`,
      method: "patch",
      requiresReason: true,
      bodyFromInput: (input) => ({ reason: input.reason }),
      group: "danger",
    });
  }

  return actions;
}

/**
 * Convenience helper: execute an action descriptor against the shared axios
 * instance. Callers pass the resolved `api` module + any collected input.
 */
export async function runOrderAction(api, action, order, input = {}) {
  const url = typeof action.endpoint === "function" ? action.endpoint(order) : action.endpoint;
  const body = action.bodyFromInput ? action.bodyFromInput(input) : action.body || {};
  const method = action.method || "patch";
  if (method === "post") return api.post(url, body);
  if (method === "delete") return api.delete(url);
  return api.patch(url, body);
}

export function displayStatus(status) {
  const key = (status || "").toLowerCase();
  return STATUS_LABELS[key] || key.replace(/_/g, " ");
}
