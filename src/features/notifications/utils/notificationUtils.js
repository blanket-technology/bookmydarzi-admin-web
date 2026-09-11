import { TYPE_LABEL } from "../constants/notificationConstants.js";

export function typeLabel(t) {
  return TYPE_LABEL[t] || (t ? t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "");
}

export function resolveDeepLink(n) {
  const orderId = n.data?.order_id;
  switch (n.deep_link) {
    case "order_details":
    case "payment_details":
    case "payment_retry":
    case "delivery_details":
    case "refund_approval":
      if (orderId != null) return `/orders/${orderId}`;
      break;
    case "tailor_application_details":
      return "/tailor-applications";
    case "support_ticket_details":
      return "/support";
    default:
      break;
  }
  if (orderId != null) return `/orders/${orderId}`;
  return null;
}

export function getDistinctTypes() {
  const seen = new Set();
  return Object.keys(TYPE_LABEL).filter((t) => {
    const label = typeLabel(t);
    if (seen.has(label)) return false;
    seen.add(label);
    return true;
  });
}

export function buildNotificationParams({ page, limit, unreadOnly, typeFilter, debouncedSearch }) {
  return {
    page,
    limit,
    unread_only: unreadOnly,
    type: typeFilter || undefined,
    search: debouncedSearch || undefined,
  };
}
