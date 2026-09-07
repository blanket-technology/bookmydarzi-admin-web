import {
  MessageSquare, RefreshCw, CheckCircle, AlertCircle,
  Search, Circle,
} from "lucide-react";
import ConversationView from "../components/ConversationView.jsx";
import SessionRow from "../components/SessionRow.jsx";
import useChatSupport from "../hooks/useChatSupport.js";
import { STATUS_LABEL } from "../constants/chatConstants.js";

export default function ChatSupportPage() {
  const {
    activeSession,
    filterStatus,
    loading,
    analytics,
    searchQuery,
    showConversation,
    fetchError,
    agentOnline,
    agentStatusLoading,
    agentToggling,
    filtered,
    statusOptions,
    setFilterStatus,
    setSearchQuery,
    fetchSessions,
    handleSessionSelect,
    handleBack,
    toggleAgentOnline,
    handleResolve,
  } = useChatSupport();

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden">
      <div
        className={`
          flex-shrink-0 flex flex-col border-r border-slate-200 bg-white transition-all duration-200
          w-full md:w-80
          ${showConversation ? "hidden md:flex" : "flex"}
        `}
      >
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <MessageSquare size={15} className="text-teal-600" />
              Support Queue
            </h2>
            <button
              onClick={fetchSessions}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          <button
            onClick={toggleAgentOnline}
            disabled={agentStatusLoading || agentToggling}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold mb-3 border transition-colors disabled:opacity-60 ${
              agentOnline
                ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
            }`}
          >
            <Circle
              size={9}
              className={agentOnline ? "text-emerald-500 fill-emerald-500" : "text-slate-400 fill-slate-400"}
            />
            {agentStatusLoading
              ? "Checking status…"
              : agentToggling
              ? "Updating…"
              : agentOnline
              ? "You're online - receiving chats"
              : "You're offline - go online to receive chats"}
          </button>

          {analytics && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-slate-50 rounded-xl p-2 text-center">
                <div className="text-base font-bold text-slate-800">{analytics.total_sessions}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Today</div>
              </div>
              <div className="bg-purple-50 rounded-xl p-2 text-center">
                <div className="text-base font-bold text-purple-600">{analytics.ai_resolve_rate}%</div>
                <div className="text-[10px] text-slate-400 mt-0.5">AI Resolved</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-2 text-center">
                <div className="text-base font-bold text-amber-600">{analytics.avg_csat ?? "–"}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Avg CSAT</div>
              </div>
            </div>
          )}

          <div className="relative mb-2.5">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by user or session ID…"
              className="w-full pl-7 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-400 bg-white"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {statusOptions.map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all ${
                  filterStatus === s
                    ? "bg-teal-700 border-teal-700 text-white shadow-sm"
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                {s === "all" ? "All" : (STATUS_LABEL[s] ?? s)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {fetchError && (
            <div className="flex items-center gap-2 px-3 py-2 text-[11px] font-medium text-red-700 bg-red-50 border-b border-red-100">
              <AlertCircle size={13} className="shrink-0" />
              <span className="truncate">{fetchError}</span>
            </div>
          )}
          {loading && filtered.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-xs text-slate-400">
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-xs text-slate-400 gap-2">
              <CheckCircle size={24} className="text-green-300" />
              <span>Queue is empty</span>
            </div>
          ) : (
            filtered.map((s) => (
              <SessionRow
                key={s.uuid}
                session={s}
                isActive={activeSession?.uuid === s.uuid}
                onClick={() => handleSessionSelect(s)}
              />
            ))
          )}
        </div>
      </div>

      <div
        className={`
          flex-1 overflow-hidden min-w-0 flex-col
          ${showConversation ? "flex" : "hidden md:flex"}
        `}
      >
        {activeSession ? (
          <ConversationView
            session={activeSession}
            onRefresh={fetchSessions}
            onResolve={handleResolve}
            onBack={handleBack}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
            <MessageSquare size={40} className="text-slate-200" />
            <p className="text-sm font-medium">Select a conversation to view</p>
          </div>
        )}
      </div>
    </div>
  );
}
