import { CHAT_STATUS_LABEL, TICKET_STATUS_LABEL } from "../constants/supportConstants.js";
import { formatDate, formatDateTime } from "../../../utils/formatters.js";

// Explicit, exhaustive mapping of every real backend status → the filter
// bucket used by the Support inbox dropdown (pending / active / in_progress /
// resolved). Previously any unmapped status silently fell through to
// "pending", so selecting "Pending" also surfaced chats in other states
// (e.g. "open", or any status the backend later adds). Mapping is now explicit
// and an unknown status returns "" (its own non-matching bucket) so it never
// pollutes a specific filter - it only appears under "All Status".
const STATUS_BUCKETS = {
  // resolved
  resolved: "resolved",
  closed: "resolved",
  // in progress (an agent is actively handling it)
  in_progress: "in_progress",
  assigned: "in_progress",
  // active (AI is handling, no human needed yet)
  ai_handling: "active",
  // pending (needs attention / waiting to be picked up)
  pending: "pending",
  pending_human: "pending",
  open: "pending",
};

export function statusBucket(status) {
  const s = (status || "").toLowerCase().trim();
  // Unknown status → "" so it does NOT match any specific filter bucket
  // (shows only under "All Status"), instead of wrongly counting as pending.
  return STATUS_BUCKETS[s] ?? "";
}

// Kept under this feature's existing names - identical option shape to the
// canonical formatters, so these just delegate now instead of maintaining a
// byte-for-byte duplicate that could silently drift.
export { formatDateTime as fmtDateTime, formatDate as fmtDate };

export function mergeInboxItems(tickets, chats) {
  const ticketItems = (tickets ?? []).map((t) => ({
    kind: "ticket",
    key: `ticket-${t.id}`,
    id: t.id,
    title: t.subject || t.ticket_code,
    subtitle: t.category,
    order_id: t.order_id,
    order_code: t.order_code || null,
    status: t.status,
    statusLabel: TICKET_STATUS_LABEL[t.status] ?? t.status,
    recency: t.created_at,
    raw: t,
  }));

  const chatItems = (chats ?? []).map((s) => ({
    kind: "chat",
    key: `chat-${s.uuid}`,
    id: s.uuid,
    title: s.customer_name || `User #${s.user_id}`,
    subtitle: s.issue_category,
    order_id: s.order_id,
    order_code: s.order_code || null,
    status: s.status,
    statusLabel: CHAT_STATUS_LABEL[s.status] ?? s.status,
    recency: s.last_message_at || s.created_at,
    raw: s,
  }));

  return [...ticketItems, ...chatItems].sort(
    (a, b) => new Date(b.recency || 0) - new Date(a.recency || 0)
  );
}

export function filterInboxItems(items, { typeFilter, statusFilter, search }) {
  return items.filter((it) => {
    if (typeFilter && it.kind !== typeFilter) return false;
    if (statusFilter && statusBucket(it.status) !== statusFilter) return false;
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      (it.title || "").toLowerCase().includes(term) ||
      (it.order_code || "").toLowerCase().includes(term) ||
      String(it.order_id || "").includes(term)
    );
  });
}

export function buildTicketListParams({ page, limit, statusFilter, debouncedSearch }) {
  const params = { page, limit };
  if (statusFilter) params.status = statusFilter;
  if (debouncedSearch) params.search = debouncedSearch;
  return params;
}

export function upsertFaq(prev, saved) {
  const idx = prev.findIndex((f) => f.id === saved.id);
  if (idx >= 0) {
    const next = [...prev];
    next[idx] = saved;
    return next;
  }
  return [saved, ...prev];
}

export function sortFaqs(faqs) {
  return [...faqs].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}
