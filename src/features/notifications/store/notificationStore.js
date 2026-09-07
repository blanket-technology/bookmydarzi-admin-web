import { create } from "zustand";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { DEFAULT_LIMIT, DEFAULT_PAGE } from "../constants/notificationConstants.js";
import { buildNotificationParams } from "../utils/notificationUtils.js";
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notificationService.js";

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  total: 0,
  unreadCount: 0,
  loading: true,
  error: "",
  page: DEFAULT_PAGE,
  limit: DEFAULT_LIMIT,
  unreadOnly: false,
  typeFilter: "",

  setPage: (page) => set({ page }),
  setLimit: (limit) => set({ limit, page: DEFAULT_PAGE }),
  setUnreadOnly: (unreadOnly) => set({ unreadOnly, page: DEFAULT_PAGE }),
  setTypeFilter: (typeFilter) => set({ typeFilter, page: DEFAULT_PAGE }),

  fetchNotifications: async () => {
    const { page, limit, unreadOnly, typeFilter } = get();
    set({ loading: true, error: "" });
    try {
      const params = buildNotificationParams({ page, limit, unreadOnly, typeFilter });
      const data = await getNotifications(params);
      set({
        notifications: data.notifications || [],
        total: data.total || 0,
        unreadCount: data.unread_count || 0,
        loading: false,
      });
    } catch (err) {
      set({
        error: extractErrorMessage(err, "Failed to load notifications."),
        loading: false,
      });
    }
  },

  refreshUnreadCount: async () => {
    try {
      const data = await getUnreadCount();
      set({ unreadCount: data.unread_count || 0 });
    } catch {
      // best-effort
    }
  },

  markRead: async (id) => {
    await markNotificationRead(id);
    set({
      notifications: get().notifications.map((n) =>
        n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
      ),
      unreadCount: Math.max(0, get().unreadCount - 1),
    });
  },

  markAllRead: async () => {
    await markAllNotificationsRead();
    await get().fetchNotifications();
  },
}));
