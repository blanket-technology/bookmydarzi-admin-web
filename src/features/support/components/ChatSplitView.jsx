import { useState, useEffect } from "react";
import { MessageSquare, Search, X } from "lucide-react";
import StatusBadge from "../../../components/common/StatusBadge.jsx";
import ConversationView from "../../chat/components/ConversationView.jsx";
import { fmtDateTime } from "../utils/supportUtils.js";

export default function ChatSplitView({ chats, activeSession, onSelect, onClose, onRefresh, onResolve }) {
  const [q, setQ] = useState("");
  const activeUuid = activeSession?.uuid;

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const term = q.trim().toLowerCase();
  const list = term
    ? chats.filter((c) => (c.title || "").toLowerCase().includes(term) || String(c.order_id || "").includes(term))
    : chats;

  // When a conversation is already open we hide the left session list entirely
  // and give the conversation the full width - the admin opened THIS specific
  // chat from the support table, so re-listing every other chat beside it is
  // redundant. The list is only shown when no session is selected (a fallback
  // "pick one" state), and can be reopened via the "All chats" back button in
  // the conversation header (onBack → onClose returns to the table).
  const showList = !activeSession;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex">
      <div className="relative m-auto bg-white w-full h-full sm:w-[95vw] sm:h-[92vh] sm:rounded-2xl shadow-2xl overflow-hidden flex">
        <button
          onClick={onClose}
          title="Close (Esc)"
          className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-lg bg-white/90 hover:bg-slate-100 text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100"
        >
          <X size={18} />
        </button>
        {showList && (
        <div className="w-72 lg:w-80 border-r border-slate-100 flex flex-col shrink-0 bg-slate-50">
          <div className="px-4 py-3.5 border-b border-slate-100 bg-white flex items-center gap-2">
            <MessageSquare size={16} className="text-teal-600" />
            <h2 className="text-sm font-bold text-slate-800">Chats</h2>
            <span className="text-[11px] text-slate-400">{chats.length}</span>
          </div>
          <div className="px-3 py-2 bg-white border-b border-slate-100">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search chats…"
                className="w-full pl-7 pr-3 py-1.5 rounded-lg text-xs bg-slate-50 border border-slate-200 outline-none focus:ring-1 focus:ring-teal-400"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {list.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-8">No chats.</p>
            ) : (
              list.map((c) => {
                const active = c.raw?.uuid === activeUuid;
                return (
                  <button
                    key={c.key}
                    onClick={() => onSelect(c.raw)}
                    className={`w-full text-left px-4 py-3 border-b border-slate-100 transition-colors ${
                      active ? "bg-teal-50" : "hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm font-semibold truncate ${active ? "text-teal-800" : "text-slate-800"}`}>
                        {c.title}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">{fmtDateTime(c.recency).split(",")[0]}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={c.status} label={c.statusLabel} />
                      {c.order_id && <span className="text-[10px] text-slate-400">#{c.order_id}</span>}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col">
          {activeSession ? (
            <ConversationView
              key={activeUuid}
              session={activeSession}
              onRefresh={onRefresh}
              onResolve={onResolve}
              onBack={onClose}
              headerRightPad
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-3">
              <MessageSquare size={40} />
              <p className="text-sm">Select a conversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
