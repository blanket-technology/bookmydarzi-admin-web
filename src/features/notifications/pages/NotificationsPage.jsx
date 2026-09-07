import { useNavigate } from "react-router-dom";
import {
  Bell, CheckCheck, Loader2, AlertCircle, RefreshCw, Search, Filter, Circle, Send, X,
} from "lucide-react";
import PageHeader from "../../../components/common/PageHeader.jsx";
import Pagination from "../../../components/common/Pagination.jsx";
import BroadcastModal from "../components/BroadcastModal.jsx";
import useNotifications from "../hooks/useNotifications.js";
import {
  ATTENTION_TYPES,
  PRIORITY_DOT,
} from "../constants/notificationConstants.js";
import { resolveDeepLink, typeLabel } from "../utils/notificationUtils.js";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const {
    visible,
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
  } = useNotifications();

  return (
    <div className="p-3 sm:p-5 w-full min-h-screen bg-gray-100">
      {showBroadcast && (
        <BroadcastModal
          onClose={() => setShowBroadcast(false)}
          onSent={handleBroadcastSent}
        />
      )}

      <PageHeader
        title="Notifications"
        subtitle={`${total} total · ${unreadCount} unread`}
        actions={
          <>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search title or body…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-4 py-1.5 rounded-full text-gray-800 text-xs outline-none w-48 bg-white"
              />
            </div>
            {distinctTypes.length > 0 && (
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg text-gray-800 text-xs outline-none bg-white font-semibold"
              >
                <option value="">All Types</option>
                {distinctTypes.map((t) => <option key={t} value={t}>{typeLabel(t)}</option>)}
              </select>
            )}
            <button
              onClick={toggleUnreadOnly}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${unreadOnly ? "bg-white text-teal-800" : "bg-white/15 hover:bg-white/25 text-white"}`}
            >
              <Filter size={13} /> {unreadOnly ? "Unread Only" : "All"}
            </button>
            <button onClick={fetchNotifications} className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
              <RefreshCw size={13} /> Refresh
            </button>
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll || unreadCount === 0}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
            >
              <CheckCheck size={13} /> Mark All Read
            </button>
            <button
              onClick={() => setShowBroadcast(true)}
              className="flex items-center gap-1.5 bg-white text-teal-800 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-100"
            >
              <Send size={13} /> Send Broadcast
            </button>
          </>
        }
      />

      {sentBanner && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-xl mb-4 text-xs">
          <CheckCheck size={14} /> {sentBanner}
          <button onClick={() => setSentBanner("")} className="ml-auto text-emerald-500 hover:text-emerald-700"><X size={14} /></button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl mb-4 text-xs">
          <AlertCircle size={14} /> {error}
          <button onClick={fetchNotifications} className="ml-auto underline font-semibold">Retry</button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="animate-spin text-teal-600" size={26} />
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Bell size={28} className="text-gray-300" />
            <p className="text-gray-400 text-sm">No notifications found.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {visible.map((n) => {
              const target = resolveDeepLink(n);
              const priorityDot = PRIORITY_DOT[n.priority];
              return (
                <div
                  key={n.id}
                  onClick={() => { if (target) { if (!n.is_read) handleMarkRead(n.id); navigate(target); } }}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${!n.is_read ? "bg-teal-50/40" : ""} ${target ? "cursor-pointer" : ""}`}
                >
                  <div className="pt-1.5 shrink-0">
                    {priorityDot ? (
                      <Circle size={9} className={priorityDot} />
                    ) : !n.is_read ? (
                      <Circle size={9} className="fill-teal-500 text-teal-500" />
                    ) : (
                      <Circle size={9} className="fill-gray-200 text-gray-200" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm ${!n.is_read ? "font-bold text-gray-800" : "font-semibold text-gray-600"}`}>{n.title}</p>
                      {ATTENTION_TYPES.has(n.type) && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase tracking-wide">
                          Action needed
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{n.body}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {n.type && (
                        <span className="text-[11px] font-semibold text-gray-400">{typeLabel(n.type)}</span>
                      )}
                      <span className="text-gray-200">·</span>
                      <span className="text-[11px] text-gray-400">
                        {n.created_at ? new Date(n.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                      </span>
                    </div>
                  </div>
                  {!n.is_read && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id); }}
                      className="shrink-0 text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100 px-2.5 py-1 rounded-lg"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {!loading && total > 0 && (
          <Pagination page={page} total={total} limit={limit} onPageChange={setPage} onLimitChange={handleLimitChange} />
        )}
      </div>
    </div>
  );
}
