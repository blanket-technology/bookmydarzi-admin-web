import { formatCurrency } from "../../../utils/formatters.js";

// Kept under this feature's existing name (fmtCurrency) so callers don't
// need to change - delegates to the canonical formatter with 2-decimal
// precision (these are exact refund/paid amounts, not rounded summaries)
// instead of maintaining a separate implementation that could drift (was
// previously missing the thousands separator every other money display uses).
export function fmtCurrency(n) {
  return formatCurrency(n, 2);
}

export function fmtDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export function buildCancellationParams({ page, pageSize, statusFilter, paymentFilter }) {
  const params = new URLSearchParams({ skip: page * pageSize, limit: pageSize });
  if (statusFilter) params.set("status", statusFilter);
  if (paymentFilter) params.set("payment_type", paymentFilter);
  return params;
}

export function getTotalPages(total, pageSize) {
  return Math.ceil(total / pageSize);
}
