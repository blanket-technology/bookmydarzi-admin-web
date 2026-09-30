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
  // Post-delivery 2h inspection window + repair loop (backend
  // app/constants/order_status.py, added the same session as this
  // constant) - was missing here entirely, which is what let the
  // POST_DELIVERY_STATUSES check below need bare string literals until
  // now.
  INSPECTION_WINDOW: "inspection_window",
  IN_REPAIR: "in_repair",
  REPAIR_COMPLETED: "repair_completed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  RETURN_PENDING: "return_pending",
  RETURN_SCHEDULED: "return_scheduled",
  RETURN_IN_TRANSIT: "return_in_transit",
  RETURNED: "returned",
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
  inspection_window: "Inspection Window",
  in_repair: "In Repair",
  repair_completed: "Repair Completed",
  completed: "Completed",
  cancelled: "Cancelled",
  return_pending: "Return Pending",
  return_scheduled: "Return Scheduled",
  return_in_transit: "Return In Transit",
  returned: "Returned",
};

// "cancelled" is intentionally NOT terminal here anymore: an order cancelled
// after the tailor already had custody continues into the return_pending/...
// sequence, so the cancel action (and its UI affordances) must still be
// hideable/considered done at that point, but the order itself isn't fully
// finished until "returned". Only truly-final states are listed.
export const TERMINAL_STATUSES = new Set(["completed", "cancelled", "order_rejected", "returned"]);

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

  // Bridge assignment is now required AS PART OF scheduling pickup when
  // nobody is assigned yet, instead of being a separate standalone step -
  // assert_pickup_employee_assigned (order_authorization.py) hard-requires
  // AssignedEmployeeId before schedule-pickup/confirm-pickup/hand-to-tailor
  // can succeed, admins included, no bypass. Only add pickup_employee_id to
  // requiresInput when AssignedEmployeeId is still null - if an employee
  // already accepted the broadcast (or was assigned earlier), scheduling
  // pickup proceeds exactly as before with no extra step; forcing a new
  // pick every time would incorrectly demand a reassignment even when the
  // right person is already on the order. runOrderAction assigns the
  // chosen employee first, then schedules the pickup, as one guided action
  // from the caller's perspective - see its own comment for why two
  // sequential calls here is safe rather than needing one atomic backend
  // endpoint.
  const needsPickupEmployee = !order.AssignedEmployeeId;

  // Bug fix: both call sites below used to unconditionally push BOTH
  // "Schedule Pickup (Instant)" and "Schedule Pickup (Scheduled)" - but the
  // customer already chose one of the two at checkout (Order.PickupType,
  // set at creation via direct_order_service.py/checkout_service.py and
  // never null from the first status onward). Showing both let an admin
  // override the customer's own choice with no indication that's what
  // they were doing. Now only the matching action renders, single-button,
  // relabeled without the "(Instant)"/"(Scheduled)" suffix since there's
  // no longer a choice being presented. Falls back to showing both only if
  // PickupType is somehow genuinely absent (shouldn't happen per the
  // backend, but a missing pickup action entirely would be worse).
  const schedulePickupActions = () => {
    const pickupType = (order.PickupType || "").toLowerCase();
    const instant = {
      id: "schedule_pickup_instant",
      label: pickupType ? "Schedule Pickup" : "Schedule Pickup (Instant)",
      endpoint: (o) => `/employee/orders/${o.Id}/schedule-pickup`,
      method: "patch",
      requiresInput: needsPickupEmployee ? ["pickup_employee_id"] : undefined,
      bodyFromInput: () => ({ pickup_type: "instant" }),
      body: needsPickupEmployee ? undefined : { pickup_type: "instant" },
      group: "primary",
    };
    const scheduled = {
      id: "schedule_pickup_scheduled",
      label: pickupType ? "Schedule Pickup" : "Schedule Pickup (Scheduled)",
      endpoint: (o) => `/employee/orders/${o.Id}/schedule-pickup`,
      method: "patch",
      requiresInput: [
        ...(needsPickupEmployee ? ["pickup_employee_id"] : []),
        "scheduled_pickup_at",
        "pickup_time_slot",
      ],
      bodyFromInput: (input) => ({
        pickup_type: "scheduled",
        scheduled_pickup_at: input.scheduled_pickup_at,
        pickup_time_slot: input.pickup_time_slot,
      }),
      group: "primary",
    };
    if (pickupType === "instant") return [instant];
    if (pickupType === "scheduled") return [scheduled];
    return [instant, { ...scheduled, group: "secondary" }];
  };

  // ── order_accepted → schedule pickup (parallel to broadcast, which is automatic) ──
  if (status === ORDER_STATUS.ORDER_ACCEPTED && (role === ROLE.EMPLOYEE || staff)) {
    actions.push(...schedulePickupActions());
  }

  // ── tailor_assigned → schedule pickup (same parallel track as
  // order_accepted; schedule_pickup_employee_order accepts both statuses,
  // so an order can enter pickup as soon as a tailor is found even if it
  // was never scheduled right after acceptance) ──
  if (status === ORDER_STATUS.TAILOR_ASSIGNED && (role === ROLE.EMPLOYEE || staff)) {
    actions.push(...schedulePickupActions());
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
      disabledReason: needsPickupEmployee ? "Assign a Bridge employee for pickup first" : null,
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
      disabledReason: !order.TailorId
        ? "Assign a tailor first"
        : needsPickupEmployee
          ? "Assign a Bridge employee for pickup first"
          : null,
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

  // ── ready_for_dispatch → manual delivery assignment (only appears once
  // the order is actually ready for it - previously the "Delivery
  // Assignment" picker was a standalone card visible at every status,
  // which both looked available long before it could ever be used and let
  // staff assign a delivery employee with no reason to yet. This is the
  // override lever for when nobody accepts the automatic delivery
  // broadcast, appearing exactly when it becomes relevant, not before -
  // same underlying endpoint (assign_bridge_service.py's
  // assign_delivery_employee) as the removed card used. ──
  if (status === ORDER_STATUS.READY_FOR_DISPATCH && (role === ROLE.EMPLOYEE || staff) && !order.DeliveryEmployeeId) {
    actions.push({
      id: "assign_delivery_employee",
      label: "Assign Delivery Employee",
      endpoint: (o) => `/admin/orders/${o.Id}/assign-delivery-employee`,
      method: "patch",
      requiresInput: ["delivery_employee_id"],
      bodyFromInput: (input) => ({ employee_id: Number(input.delivery_employee_id) }),
      group: "secondary",
    });
  }

  // ── return_pending → manual return-employee assignment (same override
  // lever as pickup/delivery above, for when nobody accepts the automatic
  // return broadcast - return_broadcast_service.py's own module docstring
  // explicitly noted this lever was missing entirely: a return stuck with
  // no eligible employee accepting had only a deduped admin notification,
  // no way for staff to force an assignment. Same underlying endpoint
  // pattern (assign_bridge_service.py's new assign_return_employee). ──
  if (status === ORDER_STATUS.RETURN_PENDING && (role === ROLE.EMPLOYEE || staff) && !order.ReturnEmployeeId) {
    actions.push({
      id: "assign_return_employee",
      label: "Assign Return Employee",
      endpoint: (o) => `/admin/orders/${o.Id}/assign-return-employee`,
      method: "patch",
      requiresInput: ["return_employee_id"],
      bodyFromInput: (input) => ({ employee_id: Number(input.return_employee_id) }),
      group: "secondary",
    });
  }

  // ── return_scheduled → mark in transit (picked up from tailor, en route
  // to customer) / return_in_transit → mark complete (handed back to
  // customer). Same endpoints the assigned Bridge employee's own app
  // already uses to self-progress their return job
  // (employee.py's mark_return_in_transit/mark_return_complete, both
  // already admin/superadmin-permitted server-side via _employee_only's
  // role list, not actually employee-exclusive despite the name) - staff
  // previously had no lever here at all once a return was assigned, a
  // dead end matching the exact gap just fixed for assignment itself. ──
  if (status === ORDER_STATUS.RETURN_SCHEDULED && (role === ROLE.EMPLOYEE || staff)) {
    actions.push({
      id: "mark_return_in_transit",
      label: "Mark Return In Transit",
      endpoint: (o) => `/employee/orders/${o.Id}/return/in-transit`,
      method: "patch",
      group: "primary",
    });
  }
  if (status === ORDER_STATUS.RETURN_IN_TRANSIT && (role === ROLE.EMPLOYEE || staff)) {
    actions.push({
      id: "mark_return_complete",
      label: "Mark Return Complete",
      endpoint: (o) => `/employee/orders/${o.Id}/return/complete`,
      method: "patch",
      group: "primary",
    });
  }

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
  // ── admin override: complete with an outstanding balance, writing it off ──
  // Distinct from the button above (which stays hard-blocked for employees
  // and for admin without deliberately choosing this) - only appears when
  // there's actually a balance to override, requires a reason (shown to
  // the admin as an explicit "₹X unpaid - proceed anyway?" prompt via
  // requiresReason), and is backed by complete_employee_order's
  // admin_override param server-side (writes RemainingAmount to 0,
  // PaymentStatus to FULLY_PAID, audited as ORDER_FORCE_DELIVERED).
  if (
    status === ORDER_STATUS.OUT_FOR_DELIVERY &&
    remaining > 0 &&
    (role === ROLE.ADMIN || role === ROLE.SUPERADMIN)
  ) {
    actions.push({
      id: "complete_order_override",
      label: `Mark Delivered Anyway (₹${remaining} Unpaid)`,
      endpoint: (o) => `/employee/orders/${o.Id}/complete`,
      method: "patch",
      requiresReason: true,
      bodyFromInput: (input) => ({
        admin_override: true,
        override_reason: input.reason,
      }),
      group: "danger",
    });
  }

  // ── assign tailor (admin/superadmin/employee) - mirrors the backend's
  // _ASSIGN_FROM whitelist exactly (assign_tailor_service.py), not just "not
  // terminal/not pending payment". The old looser check let this button
  // render (and 400 on click, no tailor_id ever accepted) for e.g.
  // ready_for_dispatch/out_for_delivery, where the backend flatly rejects
  // assignment regardless of TailorId. ──
  if (
    !order.TailorId &&
    [
      ORDER_STATUS.ORDER_PLACED,
      ORDER_STATUS.ORDER_ACCEPTED,
      ORDER_STATUS.SEARCHING_TAILOR,
      ORDER_STATUS.BROADCASTED,
      ORDER_STATUS.TAILOR_ASSIGNED,
      ORDER_STATUS.PICKUP_SCHEDULED,
      ORDER_STATUS.PICKUP_PENDING,
      ORDER_STATUS.PICKED_UP,
    ].includes(status) &&
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

  // ── force-deliver / force-complete (admin/superadmin only) ──
  // Escape hatch for a genuinely stuck order - cloth already in the
  // tailor's hands but no Bridge employee available for delivery, or a
  // tailor gone unresponsive mid-stitching - so admin can still push the
  // order through without needing Bridge/tailor to act. Not shown to
  // EMPLOYEE, same elevated bar as Cancel Order.
  //
  // Bug fix: this was first tightened from a deny-list down to "picked up
  // or later", but that still showed the button immediately after pickup -
  // while mid-stitching, nothing is actually ready to deliver yet.
  // Confirmed live: the button appeared right at "Out for Delivery"'s
  // predecessor stages too. Force Deliver now only shows once the garment
  // is genuinely finished and packed - ready_for_dispatch (tailor marked
  // it done, waiting on a delivery partner) or out_for_delivery (a
  // delivery attempt already started but got stuck) - matching the
  // tightened backend gate in order_force_service.py exactly.
  //
  // Bug fix #2: even with that status gate, the button showed the INSTANT
  // an order reached ready_for_dispatch - before the automatic delivery
  // broadcast (status_service.py's initiate_delivery_broadcast, fired on
  // this same transition) had any real chance to find a Bridge employee.
  // An admin reported this as "nonsense" - correctly, since offering the
  // override lever with equal prominence to the normal "Assign Delivery
  // Employee" button, before the normal path has even been tried, defeats
  // the point of it being an override. The backend has no broadcast-
  // attempt-count field exposed yet, so this uses the order's own
  // UpdatedAt (reliably refreshed on every status transition by
  // record_order_status, order_tracking_service.py:46) as a proxy.
  //
  // Bug fix #3: out_for_delivery was first exempted from the grace window
  // on the reasoning "reaching this status already implies a Bridge
  // employee accepted and something went wrong afterward" - but that's
  // only true once the delivery has genuinely stalled. The common case is
  // an order that JUST reached out_for_delivery (delivery employee is
  // literally en route right now) where "Mark Delivered & Completed" is
  // correctly blocked only by an outstanding balance - not stuck, working
  // exactly as intended. Showing "Force Deliver (Admin Override)" right
  // next to it, seconds after the normal delivery attempt began, is the
  // exact same premature-override problem as ready_for_dispatch, just one
  // status later. Both statuses now share the same grace window.
  const ADMIN_STAFF_ROLES = new Set([ROLE.ADMIN, ROLE.SUPERADMIN]);
  const FORCE_DELIVERABLE_FROM = new Set([
    ORDER_STATUS.READY_FOR_DISPATCH,
    ORDER_STATUS.OUT_FOR_DELIVERY,
  ]);
  const FORCE_DELIVER_GRACE_MS = 15 * 60 * 1000; // matches broadcast round cadence, not tuned precisely
  const forceDeliverTooSoon =
    FORCE_DELIVERABLE_FROM.has(status) &&
    order.UpdatedAt &&
    Date.now() - new Date(order.UpdatedAt).getTime() < FORCE_DELIVER_GRACE_MS;
  if (ADMIN_STAFF_ROLES.has(role) && FORCE_DELIVERABLE_FROM.has(status) && !forceDeliverTooSoon) {
    actions.push({
      id: "force_deliver_order",
      label: "Force Deliver (Admin Override)",
      endpoint: (o) => `/admin/orders/${o.Id}/force-deliver`,
      method: "patch",
      requiresReason: true,
      bodyFromInput: (input) => ({ reason: input.reason }),
      group: "danger",
      disabledReason: remaining > 0 ? `Balance of ₹${remaining} must be collected first` : null,
    });
  }
  // ── same override pattern as complete_order_override below: force-deliver
  // with a stuck balance, writing it off instead of staying hard-blocked ──
  if (ADMIN_STAFF_ROLES.has(role) && FORCE_DELIVERABLE_FROM.has(status) && !forceDeliverTooSoon && remaining > 0) {
    actions.push({
      id: "force_deliver_order_write_off",
      label: `Force Deliver Anyway (₹${remaining} Unpaid)`,
      endpoint: (o) => `/admin/orders/${o.Id}/force-deliver`,
      method: "patch",
      requiresReason: true,
      bodyFromInput: (input) => ({ reason: input.reason, write_off_balance: true }),
      group: "danger",
    });
  }
  // Force-complete: only once the order has actually reached Delivered or
  // is stuck somewhere in the post-delivery inspection/repair loop - there
  // is nothing to "complete" before delivery has happened, so this does
  // NOT share force-deliver's earlier stages the way the backend's
  // force_complete_order (which auto-routes through force-deliver first)
  // technically allows; the button here only appears once delivery is the
  // relevant next/recent step, keeping the two actions visually
  // distinct instead of both floating on every mid-stitching order.
  const FORCE_COMPLETABLE_FROM = new Set([
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.INSPECTION_WINDOW,
    ORDER_STATUS.IN_REPAIR,
    ORDER_STATUS.REPAIR_COMPLETED,
  ]);
  if (ADMIN_STAFF_ROLES.has(role) && FORCE_COMPLETABLE_FROM.has(status)) {
    actions.push({
      id: "force_complete_order",
      label: "Force Complete (Admin Override)",
      endpoint: (o) => `/admin/orders/${o.Id}/force-complete`,
      method: "patch",
      requiresReason: true,
      bodyFromInput: (input) => ({ reason: input.reason }),
      group: "danger",
      disabledReason: remaining > 0 ? `Balance of ₹${remaining} must be collected first` : null,
    });
  }
  // ── same override pattern as force_deliver_order_write_off above ──
  if (ADMIN_STAFF_ROLES.has(role) && FORCE_COMPLETABLE_FROM.has(status) && remaining > 0) {
    actions.push({
      id: "force_complete_order_write_off",
      label: `Force Complete Anyway (₹${remaining} Unpaid)`,
      endpoint: (o) => `/admin/orders/${o.Id}/force-complete`,
      method: "patch",
      requiresReason: true,
      bodyFromInput: (input) => ({ reason: input.reason, write_off_balance: true }),
      group: "danger",
    });
  }

  // ── cancel (admin/superadmin only via dedicated endpoint - _ADMIN_BLOCKED) ──
  // Bug fix: this used to push unconditionally for any non-employee staff
  // role, gated only by the earlier TERMINAL_STATUSES early-return - but
  // delivered/inspection_window/in_repair/repair_completed are NOT
  // terminal, so the button stayed live all the way through the
  // post-delivery inspection/repair loop. The garment has already been
  // physically handed to the customer by that point - "cancel" no longer
  // means anything (there's nothing left to cancel), and the backend's
  // cancellation_service._cancel_order_core hard-blocks exactly these
  // statuses now for the same reason (confirmed live in production: order
  // ORD-20260920-KZG4G5 was cancelled 43 seconds after being marked
  // delivered, from stage inspection_window, before that backend fix
  // shipped). A genuine post-delivery issue goes through the report-issue/
  // repair flow instead, not cancellation.
  const POST_DELIVERY_STATUSES = new Set([
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.INSPECTION_WINDOW,
    ORDER_STATUS.IN_REPAIR,
    ORDER_STATUS.REPAIR_COMPLETED,
  ]);
  if (staff && role !== ROLE.EMPLOYEE && !POST_DELIVERY_STATUSES.has(status)) {
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
 *
 * When the collected input includes pickup_employee_id (schedule_pickup_*
 * actions, only when the order isn't already claimed - see
 * getOrderActions' needsPickupEmployee), assign that Bridge employee to the
 * pickup leg FIRST, then run the actual action. Two sequential calls, not
 * one atomic backend endpoint - safe because assert_pickup_employee_
 * assigned (order_authorization.py) already requires AssignedEmployeeId to
 * exist before schedule-pickup will succeed, so if the assign call
 * succeeds but the second call then fails for any reason, the order is
 * left in a perfectly valid state (employee assigned, pickup not yet
 * scheduled) rather than a broken or stuck one - it just means the user
 * retries "Schedule Pickup" without needing to re-pick an employee.
 */
export async function runOrderAction(api, action, order, input = {}) {
  if (input.pickup_employee_id) {
    await api.patch(`/admin/orders/${order.Id}/assign-pickup-employee`, {
      employee_id: Number(input.pickup_employee_id),
    });
  }
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
