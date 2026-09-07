import { create } from "zustand";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { notifyError } from "../../../services/dialogService.js";
import { DEFAULT_LIMIT, DEFAULT_PAGE } from "../constants/bridgeConstants.js";
import { filterBridgeStaff } from "../utils/bridgeUtils.js";
import { getBridgeStaff, toggleStaffStatus } from "../services/bridgeService.js";

export const useBridgeListStore = create((set, get) => ({
  staff: [],
  loading: true,
  error: "",
  search: "",
  filterActive: "",
  page: DEFAULT_PAGE,
  limit: DEFAULT_LIMIT,

  setSearch: (search) => set({ search, page: DEFAULT_PAGE }),
  setFilterActive: (filterActive) => set({ filterActive, page: DEFAULT_PAGE }),
  setPage: (page) => set({ page }),
  setLimit: (limit) => set({ limit, page: DEFAULT_PAGE }),

  fetchStaff: async () => {
    set({ loading: true, error: "" });
    try {
      const staff = await getBridgeStaff();
      set({ staff, loading: false });
    } catch (err) {
      set({
        error: extractErrorMessage(err, "Failed to load bridge employees."),
        loading: false,
      });
    }
  },

  toggleActive: async (staffMember) => {
    try {
      await toggleStaffStatus(staffMember.id, staffMember.is_active);
      set((s) => ({
        staff: s.staff.map((item) =>
          item.id === staffMember.id ? { ...item, is_active: !staffMember.is_active } : item,
        ),
      }));
    } catch (err) {
      notifyError(extractErrorMessage(err, "Status update failed."));
    }
  },

  getFiltered: () => {
    const { staff, search, filterActive } = get();
    return filterBridgeStaff(staff, { search, filterActive });
  },

  getActiveCount: () => get().staff.filter((s) => s.is_active).length,
}));
