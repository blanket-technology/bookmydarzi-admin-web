import { useEffect, useState } from "react";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { notifyError } from "../../../services/dialogService.js";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue.js";
import { LIVE_WS_EVENTS } from "../constants/notificationConstants.js";
import { getDistinctTypes } from "../utils/notificationUtils.js";
import { useNotificationStore } from "../store/notificationStore.js";

export default function useNotifications() {
  const notifications = useNotificationStore((s) => s.notifications);
  const total = useNotificationStore((s) => s.total);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const loading = useNotificationStore((s) => s.loading);
  const error = useNotificationStore((s) => s.error);
  const page = useNotificationStore((s) => s.page);
  const limit = useNotificationStore((s) => s.limit);
  const unreadOnly = useNotificationStore((s) => s.unreadOnly);
  const typeFilter = useNotificationStore((s) => s.typeFilter);
  const setPage = useNotificationStore((s) => s.setPage);
  const setLimit = useNotificationStore((s) => s.setLimit);
  const setUnreadOnly = useNotificationStore((s) => s.setUnreadOnly);
  const setTypeFilter = useNotificationStore((s) => s.setTypeFilter);
  const setDebouncedSearch = useNotificationStore((s) => s.setDebouncedSearch);
  const storeDebouncedSearch = useNotificationStore((s) => s.debouncedSearch);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const refreshUnreadCount = useNotificationStore((s) => s.refreshUnreadCount);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  const [search, setSearch] = useState("");
  const [markingAll, setMarkingAll] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [sentBanner, setSentBanner] = useState("");

  const debouncedSearch = useDebouncedValue(search);

  // Search used to filter only the currently-loaded page of notifications
  // client-side while Pagination still showed the unfiltered server-side
  // total - a match on any other page was invisible and the "N total" count
  // was a lie. Now a real, debounced server-side query, same pattern as
  // Users/Payments.
  useEffect(() => {
    if (debouncedSearch !== storeDebouncedSearch) {
      setDebouncedSearch(debouncedSearch);
    }
  }, [debouncedSearch, storeDebouncedSearch, setDebouncedSearch]);

  useEffect(() => {
    fetchNotifications();
  }, [page, limit, unreadOnly, typeFilter, storeDebouncedSearch, fetchNotifications]);

  useEffect(() => {
    const onLiveEvent = () => {
      refreshUnreadCount();
      if (page === 1) fetchNotifications();
    };
    LIVE_WS_EVENTS.forEach((e) => window.addEventListener(e, onLiveEvent));
    return () => LIVE_WS_EVENTS.forEach((e) => window.removeEventListener(e, onLiveEvent));
  }, [page, fetchNotifications, refreshUnreadCount]);

  const distinctTypes = getDistinctTypes();

  const handleMarkRead = async (id) => {
    try {
      await markRead(id);
    } catch (err) {
      notifyError(extractErrorMessage(err, "Failed to mark as read."));
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await markAllRead();
    } catch (err) {
      notifyError(extractErrorMessage(err, "Failed to mark all as read."));
    } finally {
      setMarkingAll(false);
    }
  };

  const toggleUnreadOnly = () => setUnreadOnly(!unreadOnly);

  const handleLimitChange = (l) => setLimit(l);

  const handleBroadcastSent = (res) => {
    setShowBroadcast(false);
    setSentBanner(res.message || "Broadcast sent.");
    fetchNotifications();
  };

  return {
    visible: notifications,
    total,
    unreadCount,
    loading,
    error,
    page,
    limit,
    unreadOnly,
    search,
    typeFilter,
    markingAll,
    showBroadcast,
    sentBanner,
    distinctTypes,
    setPage,
    setSearch,
    setTypeFilter,
    setShowBroadcast,
    setSentBanner,
    toggleUnreadOnly,
    handleLimitChange,
    fetchNotifications,
    handleMarkRead,
    handleMarkAllRead,
    handleBroadcastSent,
  };
}
