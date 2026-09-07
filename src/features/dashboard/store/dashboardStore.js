import { create } from "zustand";
import {
  fetchDashboardData,
  fetchEmployeeOrders,
  fetchRecentOrders,
  fetchTailorOrders,
} from "../services/dashboardService.js";

export const useDashboardStore = create((set) => ({
  data: null,
  isLoading: true,
  error: null,
  recentOrders: [],
  ordersLoading: true,
  roleOrders: [],
  roleOrdersLoading: true,
  roleOrdersError: null,

  fetchAdminDashboard: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchDashboardData();
      set({ data, isLoading: false });
    } catch (err) {
      set({
        error: err.response?.data?.message || "Failed to load dashboard data.",
        isLoading: false,
      });
    }
  },

  fetchRecentOrders: async () => {
    set({ ordersLoading: true });
    try {
      const recentOrders = await fetchRecentOrders();
      set({ recentOrders, ordersLoading: false });
    } catch {
      set({ ordersLoading: false });
    }
  },

  fetchRoleOrders: async (role) => {
    set({ roleOrdersLoading: true, roleOrdersError: null });
    try {
      const fetcher = role === "tailor" ? fetchTailorOrders : fetchEmployeeOrders;
      const roleOrders = await fetcher();
      set({ roleOrders, roleOrdersLoading: false });
    } catch (err) {
      set({
        roleOrdersError: err.response?.data?.message || "Failed to load orders.",
        roleOrdersLoading: false,
      });
    }
  },

  reset: () =>
    set({
      data: null,
      isLoading: true,
      error: null,
      recentOrders: [],
      ordersLoading: true,
      roleOrders: [],
      roleOrdersLoading: true,
      roleOrdersError: null,
    }),
}));
