import { useEffect, useMemo, useState } from "react";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { confirmDialog, notifyError } from "../../../services/dialogService.js";
import { filterInboxItems } from "../utils/supportUtils.js";
import { useInboxStore } from "../store/inboxStore.js";

const DEFAULT_PAGE_SIZE = 25;

export default function useSupportInbox() {
  const items = useInboxStore((s) => s.items);
  const loading = useInboxStore((s) => s.loading);
  const error = useInboxStore((s) => s.error);
  const fetchInbox = useInboxStore((s) => s.fetchInbox);
  const updateTicketStatus = useInboxStore((s) => s.updateTicketStatus);
  const resolveChat = useInboxStore((s) => s.resolveChat);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewingTicketId, setViewingTicketId] = useState(null);
  const [viewingChatSession, setViewingChatSession] = useState(null);

  // Pagination over the *filtered* result, so it works together with search
  // and the status/type filters (per the ticket). Page resets to 1 when any
  // filter/search changes so you never land on an out-of-range page.
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  // Reset to page 1 when the filter/search signature changes - done during
  // render via a tracked previous value (React's recommended pattern) rather
  // than an effect, so it applies before paint with no extra render.
  const filterSig = `${search}|${typeFilter}|${statusFilter}`;
  const [lastFilterSig, setLastFilterSig] = useState(filterSig);
  if (filterSig !== lastFilterSig) {
    setLastFilterSig(filterSig);
    setPage(1);
  }

  const filtered = useMemo(
    () => filterInboxItems(items, { typeFilter, statusFilter, search }),
    [items, typeFilter, statusFilter, search]
  );
  const chatItems = items.filter((it) => it.kind === "chat");

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  // Clamp against a stale page after the filtered set shrinks (items resolved,
  // filter narrowed) so we never render a blank page.
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((safePage - 1) * limit, safePage * limit),
    [filtered, safePage, limit]
  );

  const handleResolveChat = async (uuid) => {
    if (!(await confirmDialog({
      title: "Mark conversation as resolved?",
      description: "This closes out the conversation as resolved.",
      confirmLabel: "Yes, Resolve",
      tone: "neutral",
    }))) return;
    try {
      await resolveChat(uuid);
      setViewingChatSession(null);
    } catch (err) {
      notifyError(extractErrorMessage(err, "Resolve failed"));
    }
  };

  return {
    items,
    loading,
    error,
    search,
    typeFilter,
    statusFilter,
    viewingTicketId,
    viewingChatSession,
    filtered,
    // Paginated slice + controls for the table to render.
    paginated,
    page: safePage,
    limit,
    total,
    setPage,
    setLimit,
    chatItems,
    setSearch,
    setTypeFilter,
    setStatusFilter,
    setViewingTicketId,
    setViewingChatSession,
    fetchInbox,
    updateTicketStatus,
    handleResolveChat,
  };
}
