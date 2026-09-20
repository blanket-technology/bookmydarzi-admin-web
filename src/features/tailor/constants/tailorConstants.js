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

// Add Tailor screen (POST /admin/tailor-applications) - admin fast-track
// submission into the same TailorApplication review queue the public
// /tailor/apply form uses. No login credentials are collected here anymore:
// approve_tailor_application (same as the self-service flow) issues the
// account and emails a password-setup OTP once an admin approves it.
export const INIT_ADD_FORM = {
  full_name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  specialization: "",
  experience: "",
};

// Matches TailorApplication's actual document fields (Aadhaar has separate
// front/back images; there's no generic "other document" slot on an
// application, unlike the live Tailor profile's KYC fields).
export const INIT_KYC = { aadhaar_front: null, aadhaar_back: null, pan_card: null };

export const APPLICATION_STATUS_COLOR = {
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  pending: "bg-yellow-100 text-yellow-700",
};

export const TAILOR_ADDED_EVENT = "tailor-added";
