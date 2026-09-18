// Centralised status/role badge colour map - extend as new statuses appear.
const COLORS = {
  // Activation
  active:           "bg-emerald-100 text-emerald-700",
  inactive:         "bg-rose-100 text-rose-700",
  // Verification
  verified:         "bg-emerald-100 text-emerald-700",
  pending:          "bg-amber-100 text-amber-700",
  rejected:         "bg-rose-100 text-rose-700",
  approved:         "bg-emerald-100 text-emerald-700",
  // Payments
  advance_pending:  "bg-amber-100 text-amber-700",
  advance_paid:     "bg-blue-100 text-blue-700",
  fully_paid:       "bg-emerald-100 text-emerald-700",
  advance_failed:   "bg-rose-100 text-rose-700",
  cod_pending:      "bg-orange-100 text-orange-700",
  refunded:         "bg-purple-100 text-purple-700",
  // Individual Payment row gateway status (Payment.Status - distinct
  // vocabulary from the order-level SettlementStatus keys above)
  initiated:        "bg-amber-100 text-amber-700",
  success:          "bg-emerald-100 text-emerald-700",
  failed:           "bg-rose-100 text-rose-700",
  partially_refunded: "bg-purple-100 text-purple-700",
  // Support tickets
  open:             "bg-amber-100 text-amber-700",
  in_progress:      "bg-blue-100 text-blue-700",
  resolved:         "bg-emerald-100 text-emerald-700",
  closed:           "bg-gray-100 text-gray-600",
  // Order statuses - full OrderStatus.ALL lifecycle (order_status.py) so
  // every real status gets its own colour instead of silently falling
  // back to flat gray. Grouped by stage so the colour progression itself
  // reads as "how far along" at a glance: amber (needs action/waiting) ->
  // blue (in motion / scheduled) -> indigo (assigned/broadcasting) ->
  // teal (garment physically moving) -> emerald (done) -> rose (failed/
  // cancelled).
  pending_payment:  "bg-amber-100 text-amber-700",
  payment_failed:   "bg-rose-100 text-rose-700",
  order_placed:     "bg-blue-100 text-blue-700",
  created:          "bg-gray-100 text-gray-600",
  confirmed:        "bg-blue-100 text-blue-700",
  order_accepted:   "bg-blue-100 text-blue-700",
  order_rejected:   "bg-rose-100 text-rose-700",
  searching_tailor: "bg-indigo-100 text-indigo-700",
  broadcasted:      "bg-indigo-100 text-indigo-700",
  tailor_assigned:  "bg-indigo-100 text-indigo-700",
  assigned:         "bg-indigo-100 text-indigo-700",
  pickup_scheduled: "bg-blue-100 text-blue-700",
  pickup_pending:   "bg-amber-100 text-amber-700",
  picked_up:        "bg-teal-100 text-teal-700",
  cloth_received_by_tailor: "bg-teal-100 text-teal-700",
  stitching_started: "bg-indigo-100 text-indigo-700",
  // in_progress already defined above (Support tickets) - shared as-is;
  // "actively being worked on" reads fine in blue for order stitching too.
  final_check:      "bg-amber-100 text-amber-700",
  ready_for_dispatch: "bg-blue-100 text-blue-700",
  out_for_delivery: "bg-teal-100 text-teal-700",
  delivered:        "bg-teal-100 text-teal-700",
  completed:        "bg-emerald-100 text-emerald-700",
  cancelled:        "bg-rose-100 text-rose-700",
  return_pending:   "bg-amber-100 text-amber-700",
  return_scheduled: "bg-blue-100 text-blue-700",
  return_in_transit: "bg-indigo-100 text-indigo-700",
  returned:         "bg-emerald-100 text-emerald-700",
  // Roles
  user:             "bg-blue-100 text-blue-700",
  customer:         "bg-blue-100 text-blue-700",
  tailor:           "bg-indigo-100 text-indigo-700",
  employee:         "bg-teal-100 text-teal-700",
  admin:            "bg-amber-100 text-amber-700",
  superadmin:       "bg-rose-100 text-rose-700",
};

/**
 * StatusBadge - renders a coloured pill badge.
 *
 * Props:
 *   status  {string}  key used to look up colour (case-insensitive)
 *   label   {string}  optional override display text; defaults to status
 *   dot     {boolean} show a leading dot indicator (default false)
 */
export default function StatusBadge({ status, label, dot = false }) {
  const key = (status ?? "").toLowerCase().replace(/\s+/g, "_");
  const cls = COLORS[key] ?? "bg-gray-100 text-gray-600";
  const text = label ?? status ?? "-";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${cls}`}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 shrink-0" />
      )}
      {text}
    </span>
  );
}
