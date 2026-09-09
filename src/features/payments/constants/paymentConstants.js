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
  { value: "advance_pending", label: "Online Payment Pending (incl. Initiated)" },
  { value: "fully_paid", label: "Paid" },
  { value: "advance_failed", label: "Failed" },
  { value: "cod_pending", label: "Pay on Delivery" },
];

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 25;
export const SEARCH_DEBOUNCE_MS = 400;

export const REFUNDABLE_STATUSES = ["success", "advance_paid", "fully_paid"];

export const INPUT_CLASS =
  "w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-teal-500";
