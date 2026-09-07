import { create } from "zustand";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { DEFAULT_ORDERS_LIMIT } from "../constants/userDetailConstants.js";
import { normalizeFullDetail } from "../utils/userDetailUtils.js";
import {
  deleteUser,
  fetchCustomerFullDetail,
  fetchUserAuditLogs,
  fetchUserById,
  fetchUserOrders,
  requestPasswordReset,
  updateUserStatus,
} from "../services/userDetailService.js";

export const useUserDetailStore = create((set, get) => ({
  user: null,
  loading: true,
  error: "",
  activeTab: "overview",
  orders: [],
  ordersTotal: 0,
  ordersLoading: true,
  ordersPage: 1,
  ordersLimit: DEFAULT_ORDERS_LIMIT,
  ordersStatus: "",
  auditLogs: [],
  auditLoading: true,
  fullDetail: null,
  fullDetailLoading: true,
  fullDetailError: "",
  resetLoading: false,
  resetMsg: null,
  toggling: false,
  showDeleteConfirm: false,

  setActiveTab: (activeTab) => set({ activeTab }),
  setOrdersPage: (ordersPage) => set({ ordersPage }),
  setOrdersLimit: (ordersLimit) => set({ ordersLimit, ordersPage: 1 }),
  setOrdersStatus: (ordersStatus) => set({ ordersStatus, ordersPage: 1 }),
  setShowDeleteConfirm: (showDeleteConfirm) => set({ showDeleteConfirm }),
  setResetMsg: (resetMsg) => set({ resetMsg }),

  fetchUser: async (userId) => {
    set({ loading: true, error: "" });
    try {
      const user = await fetchUserById(userId);
      set({ user, loading: false });
    } catch (err) {
      set({ error: extractErrorMessage(err, "Failed to load user."), loading: false });
    }
  },

  fetchOrders: async (userId) => {
    const { ordersPage, ordersLimit, ordersStatus } = get();
    set({ ordersLoading: true });
    try {
      const data = await fetchUserOrders(userId, {
        page: ordersPage,
        limit: ordersLimit,
        status: ordersStatus,
      });
      set({ orders: data.orders, ordersTotal: data.total, ordersLoading: false });
    } catch {
      set({ orders: [], ordersLoading: false });
    }
  },

  fetchAudit: async (userId) => {
    set({ auditLoading: true });
    try {
      const auditLogs = await fetchUserAuditLogs(userId);
      set({ auditLogs, auditLoading: false });
    } catch {
      set({ auditLogs: [], auditLoading: false });
    }
  },

  fetchFullDetail: async (userId) => {
    set({ fullDetailLoading: true, fullDetailError: "" });
    try {
      const data = await fetchCustomerFullDetail(userId);
      set({ fullDetail: normalizeFullDetail(data), fullDetailLoading: false });
    } catch (err) {
      set({
        fullDetail: null,
        fullDetailError: extractErrorMessage(err, "Failed to load customer details."),
        fullDetailLoading: false,
      });
    }
  },

  resetPassword: async () => {
    const { user } = get();
    if (!user) return;
    set({ resetLoading: true, resetMsg: null });
    try {
      await requestPasswordReset(user.Email);
      set({ resetMsg: { type: "success", text: "Password reset email sent." }, resetLoading: false });
    } catch (err) {
      set({
        resetMsg: { type: "error", text: extractErrorMessage(err, "Failed to send reset email.") },
        resetLoading: false,
      });
    }
  },

  toggleStatus: async () => {
    const { user } = get();
    if (!user) return;
    const action = user.IsActive ? "deactivate" : "activate";
    set({ toggling: true });
    try {
      await updateUserStatus(user.Id, action);
      set({ user: { ...user, IsActive: !user.IsActive }, toggling: false });
    } catch (err) {
      set({ toggling: false });
      throw err;
    }
  },

  deleteUserAccount: async () => {
    const { user } = get();
    if (!user) return false;
    set({ showDeleteConfirm: false });
    await deleteUser(user.Id);
    return true;
  },

  reset: () =>
    set({
      user: null,
      loading: true,
      error: "",
      activeTab: "overview",
      orders: [],
      ordersTotal: 0,
      ordersLoading: true,
      ordersPage: 1,
      ordersLimit: DEFAULT_ORDERS_LIMIT,
      ordersStatus: "",
      auditLogs: [],
      auditLoading: true,
      fullDetail: null,
      fullDetailLoading: true,
      fullDetailError: "",
      resetLoading: false,
      resetMsg: null,
      toggling: false,
      showDeleteConfirm: false,
    }),
}));
