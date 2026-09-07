import { create } from "zustand";
import { extractErrorMessage } from "../../../utils/formatters.js";
import {
  DEFAULT_FILTER_STATUS,
  SESSIONS_FETCH_LIMIT,
} from "../constants/chatConstants.js";
import { buildSessionsQuery } from "../utils/chatUtils.js";
import {
  getAgentStatus,
  getChatAnalytics,
  getChatSessions,
  resolveChatSession,
  updateAgentStatus,
} from "../services/chatService.js";

export const useChatStore = create((set, get) => ({
  sessions: [],
  analytics: null,
  filterStatus: DEFAULT_FILTER_STATUS,
  fetchError: null,
  agentOnline: false,
  agentStatusLoading: true,

  setFilterStatus: (filterStatus) => set({ filterStatus }),

  fetchSessions: async () => {
    const { filterStatus } = get();
    try {
      const query = buildSessionsQuery(filterStatus, SESSIONS_FETCH_LIMIT);
      const data = await getChatSessions(query);
      set({ sessions: data?.sessions ?? [], fetchError: null });
    } catch (err) {
      set({ fetchError: extractErrorMessage(err, "Could not load chat sessions.") });
    }
  },

  fetchAnalytics: async () => {
    try {
      const data = await getChatAnalytics();
      set({ analytics: data });
    } catch {
      // secondary panel - ignore
    }
  },

  fetchAgentStatus: async () => {
    try {
      const data = await getAgentStatus();
      set({ agentOnline: data?.status === "online" });
    } catch {
      // keep last-known
    } finally {
      set({ agentStatusLoading: false });
    }
  },

  toggleAgentOnline: async (agentId, currentOnline) => {
    const nextStatus = currentOnline ? "offline" : "online";
    await updateAgentStatus(agentId, nextStatus);
    set({ agentOnline: nextStatus === "online" });
    if (nextStatus === "online") await get().fetchSessions();
    return nextStatus === "online";
  },

  resolveSession: async (uuid) => {
    await resolveChatSession(uuid);
    await get().fetchSessions();
  },
}));
