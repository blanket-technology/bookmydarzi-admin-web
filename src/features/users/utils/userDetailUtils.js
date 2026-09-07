import { formatCurrency, formatDateTime } from "../../../utils/formatters.js";
import { DEFAULT_FULL_DETAIL } from "../constants/userDetailConstants.js";

export function normalizeFullDetail(data) {
  const d = data ?? {};
  return {
    addresses: d.addresses ?? [],
    measurements: d.measurements ?? [],
    payments: { total: d.payments?.total ?? 0, items: d.payments?.items ?? [] },
    carts: { total: d.carts?.total ?? 0, items: d.carts?.items ?? [] },
    support_tickets: { total: d.support_tickets?.total ?? 0, items: d.support_tickets?.items ?? [] },
    chat_sessions: { total: d.chat_sessions?.total ?? 0, items: d.chat_sessions?.items ?? [] },
    cancellations: { total: d.cancellations?.total ?? 0, items: d.cancellations?.items ?? [] },
    penalties: { total: d.penalties?.total ?? 0, items: d.penalties?.items ?? [] },
  };
}

export function computeLifetimeSpend(payments) {
  return (payments?.items || [])
    .filter((p) => {
      const status = (p.status || "").toLowerCase();
      return status === "success" || status === "captured";
    })
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
}

export function countOrdersByStatus(orders) {
  const activeOrdersCount = orders.filter((o) =>
    ["order_placed", "order_accepted", "searching_tailor", "tailor_assigned",
      "pickup_scheduled", "picked_up", "stitching_started", "in_progress",
      "ready_for_dispatch", "out_for_delivery"].includes((o.Status || "").toLowerCase())
  ).length;
  const completedOrdersCount = orders.filter((o) =>
    ["delivered", "completed"].includes((o.Status || "").toLowerCase())
  ).length;
  const cancelledOrdersCount = orders.filter((o) =>
    ["cancelled", "order_rejected"].includes((o.Status || "").toLowerCase())
  ).length;
  return { activeOrdersCount, completedOrdersCount, cancelledOrdersCount };
}

export function buildTimelineEvents({ auditLogs, orders, payments, supportTickets, navigate, onPaymentClick, onTicketClick }) {
  const events = [];
  auditLogs.forEach((log) => events.push({
    id: `audit-${log.id}`, type: "audit", at: log.created_at,
    title: log.action, subtitle: log.performed_by_name ? `by ${log.performed_by_name}` : null,
  }));
  orders.forEach((o) => events.push({
    id: `order-${o.Id}`, type: "order", at: o.CreatedAt,
    title: `Order ${o.OrderCode || `#${o.Id}`}`, subtitle: o.StatusLabel || o.Status,
    onClick: () => navigate(`/orders/${o.Id}`, { state: { order: o } }),
  }));
  payments.forEach((p) => events.push({
    id: `payment-${p.id}`, type: "payment", at: p.created_at,
    title: `Payment ${p.payment_code || `#${p.id}`}`, subtitle: `${formatCurrency(p.amount)} · ${p.status || "-"}`,
    onClick: p.order_id ? () => onPaymentClick(p.order_id) : undefined,
  }));
  supportTickets.forEach((t) => events.push({
    id: `ticket-${t.id}`, type: "support", at: t.created_at,
    title: `Ticket: ${t.subject || t.ticket_code}`, subtitle: t.status,
    onClick: () => onTicketClick(t.id),
  }));
  return events
    .filter((e) => e.at)
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .map((e) => ({ ...e, atLabel: formatDateTime(e.at) }));
}

export function getFullDetailOrDefault(fullDetail) {
  return fullDetail || DEFAULT_FULL_DETAIL;
}
