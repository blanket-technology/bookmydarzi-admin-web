import { create } from "zustand";
import { extractErrorMessage } from "../../../utils/formatters.js";
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
  ordersError: null,
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
        error: extractErrorMessage(err, "Failed to load dashboard data."),
        isLoading: false,
      });
    }
  },

  fetchRecentOrders: async () => {
    set({ ordersLoading: true, ordersError: null });
    try {
      const recentOrders = await fetchRecentOrders();
      set({ recentOrders, ordersLoading: false });
    } catch (err) {
      // Distinct error field, not just clearing to [] - otherwise a failed
      // fetch renders identically to "no recent orders" (same class of bug
      // fixed on the tailor list this session).
      set({ ordersError: extractErrorMessage(err, "Failed to load recent orders."), ordersLoading: false });
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
        roleOrdersError: extractErrorMessage(err, "Failed to load orders."),
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
      ordersError: null,
      roleOrders: [],
      roleOrdersLoading: true,
      roleOrdersError: null,
    }),
}));
