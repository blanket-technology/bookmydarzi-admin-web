import { create } from "zustand";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { INBOX_FETCH_LIMIT, TICKET_STATUS_LABEL } from "../constants/supportConstants.js";
import { mergeInboxItems } from "../utils/supportUtils.js";
import { getChatSessions, getTickets, resolveChatSession } from "../services/supportService.js";

export const useInboxStore = create((set, get) => ({
  items: [],
  loading: true,
  error: "",

  fetchInbox: async () => {
    set({ loading: true, error: "" });
    try {
      const [ticketsRes, chatRes] = await Promise.all([
        getTickets({ page: 1, limit: INBOX_FETCH_LIMIT }),
        getChatSessions({ limit: INBOX_FETCH_LIMIT }),
      ]);
      set({
        items: mergeInboxItems(ticketsRes?.tickets, chatRes?.sessions),
        loading: false,
      });
    } catch (err) {
      set({
        error: extractErrorMessage(err, "Failed to load inbox."),
        loading: false,
      });
    }
  },

  updateTicketStatus: (id, newStatus) => {
    set({
      items: get().items.map((it) =>
        it.kind === "ticket" && it.id === id
          ? { ...it, status: newStatus, statusLabel: TICKET_STATUS_LABEL[newStatus] ?? newStatus }
          : it
      ),
    });
  },

  resolveChat: async (uuid) => {
    await resolveChatSession(uuid);
    await get().fetchInbox();
  },
}));
