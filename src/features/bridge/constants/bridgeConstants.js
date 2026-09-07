export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 25;
export const API_ENDPOINT = "/admin/staff";
export const DEFAULT_PASSWORD = "Bridge@123";

export const INIT_FORM = { name: "", email: "", mobile: "", password: "" };

export const INIT_PROFILE = {
  experience_years: "",
  bridge_type: "",
  assigned_area: "",
  vehicle_type: "",
  working_shift: "",
  joining_date: "",
};

export const INIT_KYC = { aadhar: null, pan_card: null, other: null };

export const BRIDGE_TYPE_LABEL = { full_time: "Full Time", freelancer: "Freelancer" };

export const BRIDGE_TYPE_OPTIONS = [
  { value: "", label: "Select type" },
  { value: "full_time", label: "Full Time" },
  { value: "freelancer", label: "Freelancer" },
];

export const TABS = [
  { id: "overview", label: "Overview", icon: "LayoutGrid" },
  { id: "orders", label: "Orders", icon: "Package" },
  { id: "performance", label: "Performance", icon: "TrendingUp" },
  { id: "documents", label: "Documents", icon: "FileText" },
  { id: "activity", label: "Activity", icon: "History" },
];

export const ORDER_STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "order_placed", label: "Order Placed" },
  { value: "order_accepted", label: "Order Accepted" },
  { value: "order_rejected", label: "Order Rejected" },
  { value: "searching_tailor", label: "Searching Tailor" },
  { value: "tailor_assigned", label: "Tailor Assigned" },
  { value: "pickup_scheduled", label: "Pickup Scheduled" },
  { value: "picked_up", label: "Picked Up" },
  { value: "stitching_started", label: "Stitching Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "ready_for_dispatch", label: "Ready for Dispatch" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export const STATUS_LABELS = {
  pending_payment: "Pending Payment",
  payment_failed: "Payment Failed",
  order_placed: "Order Placed",
  order_accepted: "Accepted",
  order_rejected: "Rejected",
  searching_tailor: "Finding Tailor",
  broadcasted: "Broadcast Active",
  tailor_assigned: "Tailor Assigned",
  pickup_scheduled: "Pickup Scheduled",
  pickup_pending: "Pickup Pending",
  picked_up: "Cloth Picked Up",
  cloth_received_by_tailor: "With Tailor",
  stitching_started: "Stitching Started",
  in_progress: "Stitching In Progress",
  final_check: "Final Check",
  ready_for_dispatch: "Ready for Dispatch",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const TIMELINE_STATUSES = [
  ["order_placed", "Placed"],
  ["order_accepted", "Accepted"],
  ["pickup_pending", "Pickup"],
  ["picked_up", "Picked Up"],
  ["tailor_assigned", "Tailor"],
  ["cloth_received_by_tailor", "With Tailor"],
  ["in_progress", "Stitching"],
  ["ready_for_dispatch", "Ready"],
  ["out_for_delivery", "Delivery"],
  ["delivered", "Delivered"],
];

export const STATUS_BADGE = {
  delivered: "bg-emerald-100 text-emerald-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
  order_rejected: "bg-rose-100 text-rose-700",
  payment_failed: "bg-rose-100 text-rose-700",
  out_for_delivery: "bg-blue-100 text-blue-700",
  tailor_assigned: "bg-indigo-100 text-indigo-700",
  stitching_started: "bg-purple-100 text-purple-700",
  in_progress: "bg-purple-100 text-purple-700",
  final_check: "bg-violet-100 text-violet-700",
  ready_for_dispatch: "bg-violet-100 text-violet-700",
  cloth_received_by_tailor: "bg-orange-100 text-orange-700",
  picked_up: "bg-orange-100 text-orange-700",
  pickup_pending: "bg-amber-100 text-amber-700",
  pickup_scheduled: "bg-amber-100 text-amber-700",
  searching_tailor: "bg-sky-100 text-sky-700",
  broadcasted: "bg-sky-100 text-sky-700",
  order_accepted: "bg-teal-100 text-teal-700",
  order_placed: "bg-yellow-100 text-yellow-700",
  pending_payment: "bg-yellow-100 text-yellow-700",
};

export const PICKUP_TYPES = [
  { value: "instant", label: "Go Now (Instant)", desc: "Employee leaves immediately to pick up cloth" },
  { value: "scheduled", label: "Pre-Arranged (Scheduled)", desc: "Pickup time already agreed with customer" },
];

export const MEASURE_INIT = {
  profile_name: "", gender: "male", chest: "", waist: "", hips: "",
  shoulder: "", neck: "", sleeve_length: "", inseam: "", height: "",
  fit_preference: "regular", notes: "",
};

export const INPUT_CLASS =
  "w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-teal-500 bg-gray-50 focus:bg-white transition-colors";
