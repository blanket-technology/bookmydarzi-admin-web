import { useState, useEffect, useCallback } from "react";
import { Loader2, AlertCircle, X, Send } from "lucide-react";
import api from "../../services/api";
import { extractErrorMessage, formatDateTime } from "../../utils/formatters";
import { notifyError } from "../../services/dialogService";

const STATUSES = ["open", "in_progress", "resolved", "closed"];

const STATUS_BADGE = {
  open:        "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved:    "bg-emerald-100 text-emerald-700",
  closed:      "bg-gray-100 text-gray-600",
};

const STATUS_LABEL = {
  open:        "Open",
  in_progress: "In Progress",
  resolved:    "Resolved",
  closed:      "Closed",
};

const PRIORITY_BADGE = {
  low:    "bg-gray-100 text-gray-600",
  medium: "bg-amber-100 text-amber-700",
  high:   "bg-orange-100 text-orange-700",
  urgent: "bg-rose-100 text-rose-700",
};

const inp = "w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-teal-500";

// Shared support-ticket detail/reply modal, extracted from
// Support/SupportTicketsPage.jsx (also used by InboxPage.jsx) so any page
// holding a ticket ID can open the same thread view and reply inline.
export default function TicketModal({ ticketId, onClose, onStatusChanged }) {
  const [ticket, setTicket]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [reply, setReply]       = useState("");
  const [sending, setSending]   = useState(false);
  const [sendErr, setSendErr]   = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetchTicket = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await api.get(`/support/tickets/${ticketId}`);
      setTicket(res.data);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load ticket."));
    } finally { setLoading(false); }
  }, [ticketId]);

  // Fetch-on-mount/ticketId-change; setState happens inside fetchTicket's
  // async handlers, not synchronously in the effect body.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchTicket(); }, [fetchTicket]);

  const handleStatusChange = async (newStatus) => {
    setStatusUpdating(true);
    try {
      const res = await api.patch(`/support/tickets/${ticketId}/status`, { status: newStatus });
      setTicket((t) => ({ ...t, status: res.data?.status ?? newStatus }));
      onStatusChanged?.(ticketId, res.data?.status ?? newStatus);
    } catch (err) {
      notifyError(extractErrorMessage(err, "Status update failed."));
    } finally { setStatusUpdating(false); }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true); setSendErr("");
    try {
      const res = await api.post(`/support/tickets/${ticketId}/messages`, { message: reply.trim() });
      setTicket((t) => ({ ...t, messages: [...(t.messages ?? []), res.data] }));
      setReply("");
    } catch (err) {
      setSendErr(extractErrorMessage(err, "Failed to send reply."));
    } finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">

        <div className="flex items-start justify-between p-5 border-b border-gray-100 shrink-0">
          {loading ? (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Loader2 className="animate-spin" size={16} /> Loading…
            </div>
          ) : ticket ? (
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-gray-500">{ticket.ticket_code}</span>
                {ticket.priority && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_BADGE[ticket.priority] || "bg-gray-100 text-gray-600"}`}>
                    {ticket.priority}
                  </span>
                )}
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[ticket.status] || "bg-gray-100 text-gray-600"}`}>
                  {STATUS_LABEL[ticket.status] ?? ticket.status}
                </span>
              </div>
              <h3 className="font-bold text-gray-800 text-base leading-snug">{ticket.subject}</h3>
              <p className="text-xs text-gray-400 mt-0.5">Category: {ticket.category}{ticket.order_id ? ` · Order #${ticket.order_id}` : ""}</p>
            </div>
          ) : null}

          <div className="flex items-center gap-2 shrink-0">
            {ticket && (
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={statusUpdating}
                className="border-2 border-gray-200 rounded-xl px-2 py-1.5 text-xs font-semibold outline-none focus:border-teal-500 disabled:opacity-60"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
              <X size={18} className="text-gray-400 hover:text-gray-600" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs mb-4">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="animate-spin text-teal-600" size={28} />
              <p className="text-gray-500 text-sm">Loading messages…</p>
            </div>
          ) : ticket ? (
            <div className="space-y-3">
              {(ticket.messages ?? []).length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">No messages yet.</p>
              ) : (
                ticket.messages.map((msg) => {
                  const isAdmin = msg.sender_role === "admin" || msg.sender_role === "staff";
                  return (
                    <div key={msg.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                          isAdmin ? "bg-teal-700 text-white rounded-tr-sm" : "bg-gray-100 text-gray-800 rounded-tl-sm"
                        }`}
                      >
                        <p className={`text-[10px] font-semibold mb-1 ${isAdmin ? "text-teal-200" : "text-gray-400"}`}>
                          {isAdmin ? "Admin / Staff" : "Customer"}
                        </p>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                        <p className={`text-[10px] mt-1.5 text-right ${isAdmin ? "text-teal-200" : "text-gray-400"}`}>
                          {formatDateTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : null}
        </div>

        <div className="p-5 border-t border-gray-100 shrink-0">
          {sendErr && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs mb-3">
              <AlertCircle size={14} /> {sendErr}
            </div>
          )}
          <form onSubmit={handleSendReply} className="flex gap-2 items-end">
            <textarea
              rows={2}
              className={inp + " resize-none flex-1"}
              placeholder="Type your reply…"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              disabled={sending || loading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendReply(e); }
              }}
            />
            <button
              type="submit"
              disabled={sending || !reply.trim() || loading}
              className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 shrink-0"
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {sending ? "Sending…" : "Send"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
