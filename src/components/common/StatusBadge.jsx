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
  // Order statuses
  created:          "bg-gray-100 text-gray-600",
  confirmed:        "bg-blue-100 text-blue-700",
  assigned:         "bg-indigo-100 text-indigo-700",
  completed:        "bg-emerald-100 text-emerald-700",
  cancelled:        "bg-rose-100 text-rose-700",
  delivered:        "bg-teal-100 text-teal-700",
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
