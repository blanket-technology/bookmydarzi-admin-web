// Mirrors app/constants/order_status.py OrderStatus - keep in sync.
export const ORDER_STATUS = {
  ORDER_ACCEPTED: "order_accepted",
  SEARCHING_TAILOR: "searching_tailor",
  BROADCASTED: "broadcasted",
  PICKUP_SCHEDULED: "pickup_scheduled",
  PICKUP_PENDING: "pickup_pending",
  PICKED_UP: "picked_up",
  CLOTH_RECEIVED_BY_TAILOR: "cloth_received_by_tailor",
  STITCHING_STARTED: "stitching_started",
  IN_PROGRESS: "in_progress",
  FINAL_CHECK: "final_check",
  READY_FOR_DISPATCH: "ready_for_dispatch",
  OUT_FOR_DELIVERY: "out_for_delivery",
  COMPLETED: "completed",
};

export const RECENT_ORDER_STATUS_COLOR = {
  order_placed: "bg-amber-50 text-amber-700",
  order_accepted: "bg-blue-50 text-blue-700",
  searching_tailor: "bg-blue-50 text-blue-700",
  broadcasted: "bg-blue-50 text-blue-700",
  tailor_assigned: "bg-sky-50 text-sky-700",
  pickup_scheduled: "bg-sky-50 text-sky-700",
  pickup_pending: "bg-sky-50 text-sky-700",
  picked_up: "bg-indigo-50 text-indigo-700",
  cloth_received_by_tailor: "bg-indigo-50 text-indigo-700",
  stitching_started: "bg-purple-50 text-purple-700",
  in_progress: "bg-purple-50 text-purple-700",
  final_check: "bg-purple-50 text-purple-700",
  ready_for_dispatch: "bg-teal-50 text-teal-700",
  out_for_delivery: "bg-teal-50 text-teal-700",
  delivered: "bg-emerald-50 text-emerald-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-rose-50 text-rose-700",
};

export const RECENT_ORDERS_LIMIT = 8;
export const EMPLOYEE_ORDERS_LIMIT = 100;
export const TAILOR_ORDERS_LIMIT = 100;

export const DASHBOARD_ENDPOINTS = {
  DASHBOARD: "/admin/dashboard",
  ADMIN_ORDERS: "/admin/orders",
  TAILOR_ORDERS: "/orders/my-orders",
};
