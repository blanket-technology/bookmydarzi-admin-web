import { create } from "zustand";
import { PAGE_SIZE } from "../constants/cancellationConstants.js";
import { buildCancellationParams } from "../utils/cancellationUtils.js";
import { getCancellations } from "../services/cancellationService.js";

export const useCancellationStore = create((set, get) => ({
  items: [],
  total: 0,
  page: 0,
  statusFilter: "",
  paymentFilter: "",
  loading: true,
  error: "",

  setPage: (page) => set({ page }),
  setStatusFilter: (statusFilter) => set({ statusFilter, page: 0 }),
  setPaymentFilter: (paymentFilter) => set({ paymentFilter, page: 0 }),

  fetchCancellations: async () => {
    const { page, statusFilter, paymentFilter } = get();
    set({ loading: true, error: "" });
    try {
      const params = buildCancellationParams({
        page,
        pageSize: PAGE_SIZE,
        statusFilter,
        paymentFilter,
      });
      const data = await getCancellations(params);
      set({
        items: data.items ?? [],
        total: data.total ?? 0,
        loading: false,
      });
    } catch {
      set({ error: "Failed to load cancellations.", loading: false });
    }
  },
}));
