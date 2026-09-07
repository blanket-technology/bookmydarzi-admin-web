export { DEFAULT_PAGE_SIZE as PAGE_SIZE } from "../../../constants/pagination.js";

export const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Withdrawn" },
];

export const ROLE_FILTER_OPTIONS = [
  { value: "", label: "All Roles" },
  { value: "tailor", label: "Tailor" },
  { value: "employee", label: "Bridge" },
];

export const STATUS_BADGE = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  cancelled: "bg-slate-100 text-slate-600",
};

export const ROLE_BADGE = {
  tailor: "bg-indigo-100 text-indigo-700",
  employee: "bg-teal-100 text-teal-700",
};
