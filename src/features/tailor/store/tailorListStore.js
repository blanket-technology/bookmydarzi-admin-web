import { create } from "zustand";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { confirmDialog, notifyError } from "../../../services/dialogService.js";
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  INIT_FILTERS,
  TAILOR_ADDED_EVENT,
} from "../constants/tailorConstants.js";
import { filterTailors } from "../utils/tailorUtils.js";
import {
  deleteTailor,
  getTailorWorkload,
  getTailors,
  updateTailor,
} from "../services/tailorService.js";

export const useTailorListStore = create((set, get) => ({
  tailors: [],
  workload: [],
  loading: true,
  workloadLoading: false,
  search: "",
  filters: { ...INIT_FILTERS },
  page: DEFAULT_PAGE,
  limit: DEFAULT_LIMIT,
  showForm: false,
  showFilter: false,
  openFilter: "",
  workloadOpen: false,

  setSearch: (search) => set({ search, page: DEFAULT_PAGE }),
  setFilters: (filters) => set({ filters }),
  setPage: (page) => set({ page }),
  setLimit: (limit) => set({ limit, page: DEFAULT_PAGE }),
  setShowForm: (showForm) => set({ showForm }),
  setShowFilter: (showFilter) => set({ showFilter }),
  setOpenFilter: (openFilter) => set({ openFilter }),
  setWorkloadOpen: (workloadOpen) => set({ workloadOpen }),

  fetchTailors: async () => {
    set({ loading: true });
    try {
      const tailors = await getTailors();
      set({ tailors, loading: false });
    } catch {
      set({ tailors: [], loading: false });
    }
  },

  fetchWorkload: async () => {
    set({ workloadLoading: true });
    try {
      const workload = await getTailorWorkload();
      set({ workload, workloadLoading: false });
    } catch {
      set({ workload: [], workloadLoading: false });
    }
  },

  toggleActive: async (tailor) => {
    try {
      await updateTailor(tailor.tailor_id, { is_active: !tailor.is_active });
      set((s) => ({
        tailors: s.tailors.map((t) =>
          t.tailor_id === tailor.tailor_id ? { ...t, is_active: !tailor.is_active } : t,
        ),
      }));
    } catch (err) {
      notifyError(extractErrorMessage(err, "Status update failed."));
    }
  },

  toggleVerify: async (tailor) => {
    try {
      await updateTailor(tailor.tailor_id, { is_approved: !tailor.is_approved });
      set((s) => ({
        tailors: s.tailors.map((t) =>
          t.tailor_id === tailor.tailor_id ? { ...t, is_approved: !tailor.is_approved } : t,
        ),
      }));
    } catch (err) {
      notifyError(extractErrorMessage(err, "Verification update failed."));
    }
  },

  removeTailor: async (tailor) => {
    if (
      !(await confirmDialog({
        title: `Delete ${tailor.full_name || "this tailor"}?`,
        description: "Their profile will be deactivated and hidden - this can be reversed by support if needed.",
        confirmLabel: "Yes, Delete",
        tone: "danger",
      }))
    ) {
      return;
    }
    try {
      await deleteTailor(tailor.tailor_id);
      set((s) => ({
        tailors: s.tailors.filter((t) => t.tailor_id !== tailor.tailor_id),
      }));
    } catch (err) {
      notifyError(extractErrorMessage(err, "Delete failed."));
    }
  },

  getFilteredTailors: () => {
    const { tailors, search, filters } = get();
    return filterTailors(tailors, { search, filters });
  },

  init: () => {
    get().fetchTailors();
    get().fetchWorkload();
    const refresh = () => get().fetchTailors();
    window.addEventListener(TAILOR_ADDED_EVENT, refresh);
    return () => window.removeEventListener(TAILOR_ADDED_EVENT, refresh);
  },
}));
