import { create } from "zustand";
import { extractErrorMessage } from "../../../utils/formatters.js";
import {
  DEFAULT_TICKET_LIMIT,
  DEFAULT_TICKET_PAGE,
} from "../constants/supportConstants.js";
import { buildTicketListParams } from "../utils/supportUtils.js";
import { getTickets } from "../services/supportService.js";

export const useTicketsStore = create((set, get) => ({
  tickets: [],
  total: 0,
  loading: true,
  error: "",
  page: DEFAULT_TICKET_PAGE,
  limit: DEFAULT_TICKET_LIMIT,
  statusFilter: "",
  search: "",
  debouncedSearch: "",

  setPage: (page) => set({ page }),
  setLimit: (limit) => set({ limit, page: DEFAULT_TICKET_PAGE }),
  setStatusFilter: (statusFilter) => set({ statusFilter, page: DEFAULT_TICKET_PAGE }),
  setSearch: (search) => set({ search }),
  setDebouncedSearch: (debouncedSearch) => set({ debouncedSearch, page: DEFAULT_TICKET_PAGE }),

  fetchTickets: async () => {
    const { page, limit, statusFilter, debouncedSearch } = get();
    set({ loading: true, error: "" });
    try {
      const params = buildTicketListParams({ page, limit, statusFilter, debouncedSearch });
      const data = await getTickets(params);
      set({
        tickets: data?.tickets ?? [],
        total: data?.total ?? 0,
        loading: false,
      });
    } catch (err) {
      set({
        error: extractErrorMessage(err, "Failed to load tickets."),
        loading: false,
      });
    }
  },

  updateTicketStatus: (id, newStatus) => {
    set({
      tickets: get().tickets.map((t) => (t.id === id ? { ...t, status: newStatus } : t)),
    });
  },
}));
