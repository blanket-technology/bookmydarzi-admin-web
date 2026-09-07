import {
  LayoutGrid, Package, Wallet, LifeBuoy, User as UserIcon, History,
} from "lucide-react";

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

export const ACTIVE_STATUSES = new Set([
  "order_placed", "order_accepted", "searching_tailor", "tailor_assigned",
  "pickup_scheduled", "picked_up", "stitching_started", "in_progress",
  "ready_for_dispatch", "out_for_delivery",
]);

export const ROLE_LABEL = {
  user: "Customer", employee: "Employee", tailor: "Tailor",
  admin: "Admin", superadmin: "Super Admin",
};

export const TABS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "orders", label: "Orders", icon: Package },
  { id: "payments", label: "Payments", icon: Wallet },
  { id: "support", label: "Support", icon: LifeBuoy },
  { id: "personal", label: "Personal", icon: UserIcon },
  { id: "activity", label: "Activity", icon: History },
];

export const DEFAULT_FULL_DETAIL = {
  addresses: [],
  measurements: [],
  payments: { total: 0, items: [] },
  carts: { total: 0, items: [] },
  support_tickets: { total: 0, items: [] },
  chat_sessions: { total: 0, items: [] },
  cancellations: { total: 0, items: [] },
  penalties: { total: 0, items: [] },
};

export const DEFAULT_ORDERS_LIMIT = 10;
export const AUDIT_LIMIT = 20;
