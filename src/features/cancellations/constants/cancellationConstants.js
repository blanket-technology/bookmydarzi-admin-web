export { DEFAULT_PAGE_SIZE as PAGE_SIZE } from "../../../constants/pagination.js";

export const STATUS_BADGE = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-blue-100 text-blue-700",
  refunded: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  contact_support: "bg-purple-100 text-purple-700",
};

export const PAYMENT_BADGE = {
  prepaid: "bg-blue-50 text-blue-600 border border-blue-200",
  postpaid: "bg-gray-100 text-gray-600",
};

export const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "refunded", label: "Refunded" },
  { value: "rejected", label: "Rejected" },
  { value: "contact_support", label: "Contact Support" },
];

export const PAYMENT_FILTER_OPTIONS = [
  { value: "", label: "All Payment Types" },
  { value: "prepaid", label: "Prepaid" },
  { value: "postpaid", label: "Postpaid" },
];

export const TABLE_HEADERS = [
  "Code", "Order", "Customer", "Type", "Paid", "Refund", "Stage", "Status", "Created", "",
];
