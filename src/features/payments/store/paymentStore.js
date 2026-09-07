import { create } from "zustand";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { DEFAULT_LIMIT, DEFAULT_PAGE } from "../constants/paymentConstants.js";
import { buildOrderListParams } from "../utils/paymentUtils.js";
import * as paymentService from "../services/paymentService.js";

export const usePaymentStore = create((set, get) => ({
  orders: [],
  total: 0,
  loading: true,
  error: "",
  page: DEFAULT_PAGE,
  limit: DEFAULT_LIMIT,
  filterStatus: "",
  search: "",
  debouncedSearch: "",

  setPage: (page) => set({ page }),
  setLimit: (limit) => set({ limit, page: DEFAULT_PAGE }),
  setFilterStatus: (filterStatus) => set({ filterStatus, page: DEFAULT_PAGE }),
  setSearch: (search) => set({ search }),
  setDebouncedSearch: (debouncedSearch) => set({ debouncedSearch, page: DEFAULT_PAGE }),

  fetchOrders: async () => {
    const { page, limit, filterStatus, debouncedSearch } = get();
    set({ loading: true, error: "" });
    try {
      const params = buildOrderListParams({ page, limit, filterStatus, debouncedSearch });
      const data = await paymentService.getOrders(params);
      set({
        orders: data.orders || [],
        total: data.total || 0,
        loading: false,
      });
    } catch (err) {
      set({
        error: extractErrorMessage(err, "Failed to load payment data."),
        loading: false,
      });
    }
  },

  syncPaymentForOrder: async (orderId) => {
    const pmt = await paymentService.getPaymentByOrderId(orderId);
    const pmtId = pmt?.Id ?? pmt?.payment_id;
    if (!pmtId) throw new Error("No payment found for this order.");
    await paymentService.syncPayment(pmtId);
    await get().fetchOrders();
  },
}));
