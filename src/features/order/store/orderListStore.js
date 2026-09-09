import { create } from "zustand";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { notifyError } from "../../../services/dialogService.js";
import { DEFAULT_LIMIT, DEFAULT_PAGE } from "../constants/orderConstants.js";
import { buildOrdersListParams } from "../utils/orderUtils.js";
import {
  cancelOrder,
  getOrdersList,
  getTailorsForFilter,
  isTailorRole,
  readCachedOrders,
  resolveOrdersEndpoint,
} from "../services/orderService.js";

export const useOrderListStore = create((set, get) => ({
  orders: [],
  total: 0,
  fetching: true,
  fetchError: null,
  filterStatus: "",
  filterPayment: "",
  filterTailor: "",
  dateFrom: "",
  dateTo: "",
  needsManualAssignment: false,
  showFilters: false,
  search: "",
  debouncedSearch: "",
  page: DEFAULT_PAGE,
  limit: DEFAULT_LIMIT,
  tailors: [],
  cancelTarget: null,
  cancelling: false,
  requestId: 0,
  tailorsRequestId: 0,

  setFilterStatus: (filterStatus) => set({ filterStatus, page: DEFAULT_PAGE }),
  setFilterPayment: (filterPayment) => set({ filterPayment, page: DEFAULT_PAGE }),
  setFilterTailor: (filterTailor) => set({ filterTailor, page: DEFAULT_PAGE }),
  setDateFrom: (dateFrom) => set({ dateFrom, page: DEFAULT_PAGE }),
  setDateTo: (dateTo) => set({ dateTo, page: DEFAULT_PAGE }),
  setNeedsManualAssignment: (needsManualAssignment) => set({ needsManualAssignment, page: DEFAULT_PAGE }),
  setShowFilters: (showFilters) => set({ showFilters }),
  setSearch: (search) => set({ search }),
  setDebouncedSearch: (debouncedSearch) => set({ debouncedSearch, page: DEFAULT_PAGE }),
  setPage: (page) => set({ page }),
  setLimit: (limit) => set({ limit, page: DEFAULT_PAGE }),
  setCancelTarget: (cancelTarget) => set({ cancelTarget }),

  fetchTailors: async () => {
    if (isTailorRole()) return;
    const tailorsRequestId = get().tailorsRequestId + 1;
    set({ tailorsRequestId });
    try {
      const role = (JSON.parse(sessionStorage.getItem("user") || "{}").Role || "").toLowerCase();
      const tailors = await getTailorsForFilter(role);
      if (get().tailorsRequestId !== tailorsRequestId) return;
      set({ tailors });
    } catch {
      if (get().tailorsRequestId !== tailorsRequestId) return;
      set({ tailors: [] });
    }
  },

  fetchOrders: async () => {
    if (!sessionStorage.getItem("access_token")) {
      set({ orders: [], total: 0, fetching: false, fetchError: null });
      return;
    }

    const state = get();
    const requestId = state.requestId + 1;
    const isTailor = isTailorRole();

    set({ requestId, fetching: true, fetchError: null });

    try {
      const params = buildOrdersListParams({
        page: state.page,
        limit: state.limit,
        isTailor,
        filterStatus: state.filterStatus,
        debouncedSearch: state.debouncedSearch,
        filterPayment: state.filterPayment,
        filterTailor: state.filterTailor,
        dateFrom: state.dateFrom,
        dateTo: state.dateTo,
        needsManualAssignment: state.needsManualAssignment,
      });
      const data = await getOrdersList({
        endpoint: resolveOrdersEndpoint(),
        params,
      });

      if (get().requestId !== requestId) return;

      const list = Array.isArray(data.orders) ? data.orders : [];
      set({ orders: list, total: data.total ?? list.length, fetching: false });
    } catch (err) {
      if (get().requestId !== requestId) return;

      const isAuth = err.response?.status === 401 || err.response?.status === 403;
      if (isAuth) {
        set({ orders: [], fetchError: "Session expired - please log in again.", fetching: false });
        return;
      }

      const cached = readCachedOrders();
      if (cached) {
        set({
          orders: cached.orders || [],
          total: cached.total ?? (cached.orders || []).length,
          fetchError: "Could not reach the order service - showing cached data.",
          fetching: false,
        });
      } else {
        set({ fetchError: "Could not reach the order service.", fetching: false });
      }
    }
  },

  confirmCancel: async (reason) => {
    const { cancelTarget } = get();
    if (!reason || !cancelTarget) return;
    set({ cancelling: true });
    try {
      await cancelOrder(cancelTarget.Id, reason);
      set({ cancelTarget: null });
      get().fetchOrders();
    } catch (err) {
      notifyError(extractErrorMessage(err, "Failed to cancel order."));
    } finally {
      set({ cancelling: false });
    }
  },

  clearAdvancedFilters: () =>
    set({
      filterPayment: "",
      filterTailor: "",
      dateFrom: "",
      dateTo: "",
      needsManualAssignment: false,
      page: DEFAULT_PAGE,
    }),
}));
