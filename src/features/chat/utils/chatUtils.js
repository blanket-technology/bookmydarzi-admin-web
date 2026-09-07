import { WS_BASE_URL } from "../../../config/env.js";

export function timeSince(iso) {
  if (!iso) return "–";
  const date = new Date(iso);
  const diff = Math.floor((Date.now() - date) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;

  const days = Math.floor(diff / 86400);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

export function timeFmt(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function buildSessionsQuery(filterStatus, limit) {
  return filterStatus !== "all" ? `?status=${filterStatus}&limit=${limit}` : `?limit=${limit}`;
}

export function filterSessions(sessions, searchQuery) {
  return sessions.filter(
    (s) => !searchQuery || s.uuid?.includes(searchQuery) || String(s.user_id)?.includes(searchQuery)
  );
}

export function getChatWsUrl(sessionUuid) {
  // No token in the URL - it would leak into proxy/server access logs, browser
  // history and Referer headers. The caller authenticates via the first frame
  // ({"type":"auth","token":...}) instead; the backend prefers this. See
  // app/core/websocket_auth.py. Base URL comes from central env config only.
  return `${WS_BASE_URL}/ws/chat/${sessionUuid}`;
}

export function applyQuickReplyTemplate(body, userId, customerName) {
  return body.replace("{{customer_name}}", customerName || `User #${userId}`);
}
