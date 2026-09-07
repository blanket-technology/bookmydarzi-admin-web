import { create } from "zustand";
import { extractErrorMessage } from "../../../utils/formatters.js";
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  DEFAULT_ROLE_FILTER,
} from "../constants/userConstants.js";
import { buildUserListParams } from "../utils/userUtils.js";
import { getUsers } from "../services/userService.js";

export const useUserStore = create((set, get) => ({
  users: [],
  total: 0,
  loading: true,
  error: "",
  page: DEFAULT_PAGE,
  limit: DEFAULT_LIMIT,
  search: "",
  debouncedSearch: "",
  roleFilter: DEFAULT_ROLE_FILTER,
  statusFilter: "",
  requestId: 0,

  setSearch: (search) => set({ search }),
  setDebouncedSearch: (debouncedSearch) => set({ debouncedSearch, page: DEFAULT_PAGE }),
  setRoleFilter: (roleFilter) => set({ roleFilter, page: DEFAULT_PAGE }),
  setStatusFilter: (statusFilter) => set({ statusFilter, page: DEFAULT_PAGE }),
  setPage: (page) => set({ page }),
  setLimit: (limit) => set({ limit, page: DEFAULT_PAGE }),

  fetchUsers: async () => {
    const { page, limit, debouncedSearch, roleFilter, statusFilter } = get();
    const requestId = get().requestId + 1;
    set({ requestId, loading: true, error: "" });
    try {
      const params = buildUserListParams({
        page,
        limit,
        debouncedSearch,
        roleFilter,
        statusFilter,
      });
      const data = await getUsers(params);
      if (get().requestId !== requestId) return;
      set({
        users: data.users || [],
        total: data.total || 0,
        loading: false,
      });
    } catch (err) {
      if (get().requestId !== requestId) return;
      set({
        error: extractErrorMessage(err, "Failed to load users."),
        loading: false,
      });
    }
  },

  reset: () =>
    set({
      users: [],
      total: 0,
      loading: true,
      error: "",
      page: DEFAULT_PAGE,
      limit: DEFAULT_LIMIT,
      search: "",
      debouncedSearch: "",
      roleFilter: DEFAULT_ROLE_FILTER,
      statusFilter: "",
    }),
}));
