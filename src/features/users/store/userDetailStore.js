import { create } from "zustand";
import { DEFAULT_ORDERS_LIMIT } from "../constants/userDetailConstants.js";

// UI-only state for the user detail page - all data fetching/mutation
// (fetchUser, fetchOrders, resetPassword, toggleStatus, deleteUserAccount,
// etc.) migrated to React Query in useUserDetail.js, which handles loading/
// error state and optimistic updates per-call there instead. The old
// data-fetching actions that used to live here were dead code (nothing
// called them) left over from before that migration, including a
// toggleStatus/deleteUserAccount pair with no error handling at all - kept
// only the fields useUserDetail.js still actually reads.
export const useUserDetailStore = create((set) => ({
  activeTab: "overview",
  ordersPage: 1,
  ordersLimit: DEFAULT_ORDERS_LIMIT,
  ordersStatus: "",
  showDeleteConfirm: false,
  resetMsg: null,

  setActiveTab: (activeTab) => set({ activeTab }),
  setOrdersPage: (ordersPage) => set({ ordersPage }),
  setOrdersLimit: (ordersLimit) => set({ ordersLimit, ordersPage: 1 }),
  setOrdersStatus: (ordersStatus) => set({ ordersStatus, ordersPage: 1 }),
  setShowDeleteConfirm: (showDeleteConfirm) => set({ showDeleteConfirm }),
  setResetMsg: (resetMsg) => set({ resetMsg }),

  reset: () =>
    set({
      activeTab: "overview",
      ordersPage: 1,
      ordersLimit: DEFAULT_ORDERS_LIMIT,
      ordersStatus: "",
      showDeleteConfirm: false,
      resetMsg: null,
    }),
}));
