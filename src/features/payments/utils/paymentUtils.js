import { REFUNDABLE_STATUSES } from "../constants/paymentConstants.js";

export function isRefundableOrder(order) {
  const s = (order.SettlementStatus || order.PaymentStatus || "").toLowerCase();
  return REFUNDABLE_STATUSES.includes(s);
}

export function getPaymentId(payment) {
  return payment?.Id ?? payment?.payment_id ?? null;
}

export function calculateAlreadyRefunded(refunds) {
  // manual_completed (see paymentService.markRefundManual) counts the
  // same as processed - the money genuinely left via the admin's own
  // banking, it just didn't go through Razorpay. Without this, a
  // manually-settled refund would still show as "refundable" here,
  // letting an admin accidentally issue a second refund for an amount
  // already paid out. Mirrors the same fix on the backend
  // (refund_service._refunded_so_far).
  return refunds
    .filter((r) => ["initiated", "processed", "manual_completed"].includes(r.status))
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
