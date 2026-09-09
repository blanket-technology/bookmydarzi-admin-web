import { REFUNDABLE_STATUSES } from "../constants/paymentConstants.js";

export function isRefundableOrder(order) {
  const s = (order.SettlementStatus || order.PaymentStatus || "").toLowerCase();
  return REFUNDABLE_STATUSES.includes(s);
}

export function getPaymentId(payment) {
  return payment?.Id ?? payment?.payment_id ?? null;
}

export function calculateAlreadyRefunded(refunds) {
  return refunds
    .filter((r) => ["initiated", "processed"].includes(r.status))
    .reduce((sum, r) => {
      const amount = Number.parseFloat(r.amount);
      return sum + (Number.isFinite(amount) ? amount : 0);
    }, 0);
}

export function calculateRefundableAmount(payment, refunds) {
  const alreadyRefunded = calculateAlreadyRefunded(refunds);
  const paid = Number.parseFloat(payment?.Amount);
  if (!payment || !Number.isFinite(paid)) return 0;
  return Math.max(0, paid - alreadyRefunded);
}

export function buildOrderListParams({ page, limit, filterStatus, debouncedSearch }) {
  return {
    page,
    limit,
    payment_status: filterStatus || undefined,
    search: debouncedSearch || undefined,
  };
}

export function buildRefundPayload(amount, reason) {
  const payload = {};
  const parsedAmount = parseFloat(amount);
  if (!isNaN(parsedAmount) && parsedAmount > 0) payload.amount = parsedAmount;
  if (reason.trim()) payload.reason = reason.trim();
  return payload;
}

export function buildStatusOverridePayload(status, transactionId, notes) {
  const payload = { status };
  if (status === "success" && transactionId.trim()) payload.transaction_id = transactionId.trim();
  if (notes.trim()) payload.notes = notes.trim();
  return payload;
}
