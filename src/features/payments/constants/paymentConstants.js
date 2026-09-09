export const STATUS_BADGE = {
  success: "bg-emerald-100 text-emerald-700",
  advance_paid: "bg-blue-100 text-blue-700",
  fully_paid: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700",
  advance_pending: "bg-amber-100 text-amber-700",
  balance_pending: "bg-orange-100 text-orange-700",
  advance_failed: "bg-rose-100 text-rose-700",
  cod_pending: "bg-cyan-100 text-cyan-700",
  pending: "bg-amber-100 text-amber-700",
  refunded: "bg-gray-100 text-gray-500 line-through",
  initiated: "bg-yellow-100 text-yellow-700",
};

export const OVERRIDE_STATUSES = ["initiated", "success", "failed", "pending"];

// Single source of truth for how every payment-related status is WORDED,
// across two genuinely different backend vocabularies that used to leak
// into the UI verbatim and inconsistently:
//   - Order-level SettlementStatus (Order.PaymentStatus): advance_pending,
//     fully_paid, advance_failed, cod_pending, balance_pending, advance_paid
//     - shown in the payments table, filter dropdown, and KPI cards.
//   - Payment-record Status (Payment.Status): initiated, success, failed,
//     refunded, partially_refunded - shown only in the Payment Details
//     modal, for the single most recent payment row on that order.
// These are different concepts (one order can have zero or one payment row
// at any given time; the order's settlement status derives from it plus
// order-level facts like COD), so they are NOT merged into one enum - but
// every status word an admin actually SEES is resolved through this one
// map, so "pending" always reads the same everywhere it appears instead of
// drifting into "Payment Pending" in one place and "Pending" in another.
export const PAYMENT_STATUS_LABELS = {
  // Order-level SettlementStatus
  advance_pending: "Online Payment Pending",
  advance_paid: "Paid",
  fully_paid: "Paid",
  advance_failed: "Failed",
  balance_pending: "Balance Pending",
  cod_pending: "Pay on Delivery",
  // Payment-record Status
  initiated: "Online Payment Pending",
  success: "Paid",
  failed: "Failed",
  refunded: "Refunded",
  partially_refunded: "Partially Refunded",
  pending: "Pending",
};

export function paymentStatusLabel(status) {
  const key = (status || "").toLowerCase().trim();
  return PAYMENT_STATUS_LABELS[key] || (key ? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "-");
}

// The advance/balance split is retired (see backend OrderPaymentStatus note):
// the full amount is one payment. So advance_paid / balance_pending are dead
// options and are removed here; the remaining statuses use plain-language
// labels. Backend filter values are unchanged (advance_pending = the single
// pending online payment).
// "Initiated" (the per-payment-record status shown in Payment Details, see
// PaymentStatus.INITIATED on the backend) has no filter option of its own
// because it isn't an order-level settlement bucket - an order with an
// Initiated payment is still "Online Payment Pending" at the order level
// (advance_pending), which this filter already selects. The label spells
// that mapping out so it isn't a dead end for an admin searching for
// "Initiated" payments specifically.
export const PAYMENT_STATUS_FILTER_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "advance_pending", label: `${PAYMENT_STATUS_LABELS.advance_pending} (incl. Initiated)` },
  { value: "fully_paid", label: PAYMENT_STATUS_LABELS.fully_paid },
  { value: "advance_failed", label: PAYMENT_STATUS_LABELS.advance_failed },
  { value: "cod_pending", label: PAYMENT_STATUS_LABELS.cod_pending },
];

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 25;
export const SEARCH_DEBOUNCE_MS = 400;

export const REFUNDABLE_STATUSES = ["success", "advance_paid", "fully_paid"];

export const INPUT_CLASS =
  "w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-teal-500";
