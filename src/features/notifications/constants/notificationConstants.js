export const BROADCAST_TYPES = ["promo", "system", "order_update", "payment", "support", "chat"];

export const TYPE_LABEL = {
  order_update: "Order",
  payment: "Payment",
  support: "Support",
  chat: "Chat",
  promo: "Promo",
  broadcast_offer: "Offer",
  staff_alert: "Staff",
  system_alert: "System",
  system: "System",
};

export const ATTENTION_TYPES = new Set(["staff_alert", "system_alert"]);

export const PRIORITY_DOT = {
  critical: "fill-red-600 text-red-600",
  high: "fill-amber-500 text-amber-500",
};

export const TARGET_ROLES = [
  { value: "user", label: "All Customers" },
  { value: "tailor", label: "All Tailors" },
  { value: "employee", label: "All Employees" },
  { value: "admin", label: "All Admins" },
];

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 25;

export const LIVE_WS_EVENTS = [
  "bmd:NEW_ORDER",
  "bmd:ORDER_STATUS_UPDATED",
  "bmd:BILLING_UPDATED",
  "bmd:HOME_UPDATED",
  // Most order-lifecycle events (tailor assigned, pickup, stitching,
  // dispatch, delivered, cancelled, refunds, COD) go through
  // notification_service.create_notification, which fires "NOTIFICATION" -
  // ORDER_STATUS_UPDATED only fires from the admin manual-status-edit tool.
  "bmd:NOTIFICATION",
];
