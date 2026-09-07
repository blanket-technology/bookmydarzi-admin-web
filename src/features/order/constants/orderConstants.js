export const PAYMENT_STATUS_OPTIONS = [
  ["cod_pending", "Pay on Delivery"],
  ["advance_pending", "Advance Pending"],
  ["fully_paid", "Fully Paid"],
  ["advance_failed", "Payment Failed"],
];

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 25;

export const PHOTO_UPLOAD_STAGES = new Set([
  "stitching_started",
  "in_progress",
  "final_check",
]);

export const STATUS_THEME = {
  delivered: { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-500", accent: "border-teal-400" },
  completed: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", accent: "border-emerald-400" },
  cancelled: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500", accent: "border-rose-400" },
  order_rejected: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500", accent: "border-rose-400" },
  out_for_delivery: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", accent: "border-blue-400" },
  ready_for_dispatch: { bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-400", accent: "border-blue-300" },
  tailor_assigned: { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500", accent: "border-indigo-400" },
  cloth_received_by_tailor: { bg: "bg-indigo-50", text: "text-indigo-600", dot: "bg-indigo-400", accent: "border-indigo-300" },
  stitching_started: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500", accent: "border-purple-400" },
  in_progress: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500", accent: "border-purple-400" },
  final_check: { bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500", accent: "border-violet-400" },
  picked_up: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500", accent: "border-orange-400" },
  pickup_pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", accent: "border-amber-400" },
  pickup_scheduled: { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-400", accent: "border-amber-300" },
  order_accepted: { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-500", accent: "border-teal-400" },
  order_placed: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500", accent: "border-yellow-400" },
  searching_tailor: { bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-500", accent: "border-sky-400" },
  broadcasted: { bg: "bg-sky-50", text: "text-sky-800", dot: "bg-sky-600", accent: "border-sky-500" },
  pending_payment: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400", accent: "border-gray-300" },
  payment_failed: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500", accent: "border-rose-400" },
};

export const DEFAULT_THEME = {
  bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-400", accent: "border-gray-200",
};

export const ORDERS_CACHE_KEY = "bridge_orders_cache";
