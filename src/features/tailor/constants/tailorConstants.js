export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 25;

export const FILTER_GROUPS = [
  { key: "verify", label: "Verify", opts: ["Verified", "Pending"] },
  { key: "status", label: "Status", opts: ["Active", "Inactive"] },
  { key: "role", label: "Availability", opts: ["Available", "Busy"] },
];

export const INIT_FILTERS = { verify: [], status: [], role: [] };

export const TABS = [
  { id: "overview", label: "Overview", icon: "LayoutGrid" },
  { id: "orders", label: "Orders", icon: "Package" },
  { id: "performance", label: "Performance", icon: "TrendingUp" },
  { id: "documents", label: "Documents", icon: "FileText" },
  { id: "activity", label: "Activity", icon: "History" },
];

export const ORDER_STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "tailor_assigned", label: "Tailor Assigned" },
  { value: "pickup_scheduled", label: "Pickup Scheduled" },
  { value: "picked_up", label: "Picked Up" },
  { value: "cloth_received_by_tailor", label: "Cloth Received" },
  { value: "stitching_started", label: "Stitching Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "final_check", label: "Final Check (QC)" },
  { value: "ready_for_dispatch", label: "Ready for Dispatch" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export const PENDING_STITCHING_STATUSES = new Set([
  "tailor_assigned", "pickup_scheduled", "pickup_pending", "picked_up", "cloth_received_by_tailor",
]);

export const NON_TERMINAL_STATUSES = new Set([
  "tailor_assigned", "pickup_scheduled", "pickup_pending", "picked_up", "cloth_received_by_tailor",
  "stitching_started", "in_progress", "final_check", "ready_for_dispatch", "out_for_delivery",
]);

// Add Tailor screen (POST /admin/staff, role=tailor) - immediate account
// creation by an admin, distinct from the public /tailor/apply queue.
export const INIT_ADD_FORM = {
  full_name: "",
  email: "",
  phone: "",
  password: "",
  specialization: "",
  experience: "",
  location: "",
  bio: "",
};

export const INIT_KYC = { aadhar: null, pan_card: null, other: null };
export const DEFAULT_TAILOR_PASSWORD = "Tailor@123";

export const APPLICATION_STATUS_COLOR = {
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  pending: "bg-yellow-100 text-yellow-700",
};

export const TAILOR_ADDED_EVENT = "tailor-added";
