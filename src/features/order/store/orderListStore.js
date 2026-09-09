import { create } from "zustand";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { notifyError } from "../../../services/dialogService.js";
import { DEFAULT_LIMIT, DEFAULT_PAGE } from "../constants/orderConstants.js";
import { cancelOrder, getTailorsForFilter, isTailorRole } from "../services/orderService.js";

// orders/total/fetching/fetchError/fetchOrders used to live here too, before
// the page moved to React Query (see useOrderList.js) - its own useQuery is
// the actual data source now, and nothing reads this store's versions of
// those fields. Removed: a second, never-invalidated cache sitting next to
// the real one is exactly the kind of thing a future page could wire into
// by mistake and silently show stale data forever (the same class of bug
// fixed on the cancellations store this session).
export const useOrderListStore = create((set, get) => ({
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

  confirmCancel: async (reason) => {
    const { cancelTarget } = get();
    if (!reason || !cancelTarget) return;
    set({ cancelling: true });
    try {
      await cancelOrder(cancelTarget.Id, reason);
      set({ cancelTarget: null });
      // Refetching the list is the caller's job now (useOrderList.js wraps
      // this and invalidates the React Query cache the page actually reads
      // from - this store no longer has its own order list to refresh).
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
