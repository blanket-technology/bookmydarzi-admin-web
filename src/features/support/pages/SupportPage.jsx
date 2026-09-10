import {
  Inbox as InboxIcon, MessageSquare, Loader2, AlertCircle,
  Search, RefreshCw,
} from "lucide-react";
import PageHeader from "../../../components/common/PageHeader.jsx";
import Pagination from "../../../components/common/Pagination.jsx";
import StatusBadge from "../../../components/common/StatusBadge.jsx";
import TicketModal from "../../../components/common/TicketModal.jsx";
import ChatSplitView from "../components/ChatSplitView.jsx";
import useSupportInbox from "../hooks/useSupportInbox.js";
import { fmtDateTime } from "../utils/supportUtils.js";

export default function SupportPage() {
  const {
    loading,
    error,
    search,
    typeFilter,
    statusFilter,
    viewingTicketId,
    viewingChatSession,
    filtered,
    paginated,
    page,
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
  } = useSupportInbox();

  return (
    <>
      {viewingTicketId && (
        <TicketModal
          ticketId={viewingTicketId}
          onClose={() => setViewingTicketId(null)}
          onStatusChanged={updateTicketStatus}
        />
      )}

      {viewingChatSession && (
        <ChatSplitView
          chats={chatItems}
          activeSession={viewingChatSession}
          onSelect={(raw) => setViewingChatSession(raw)}
          onClose={() => setViewingChatSession(null)}
          onRefresh={fetchInbox}
          onResolve={handleResolveChat}
        />
      )}

      <div className="p-3 sm:p-5 w-full min-h-screen bg-gray-100">
        <PageHeader
          title="Inbox"
          subtitle={`${filtered.length} conversation${filtered.length !== 1 ? "s" : ""}`}
          actions={
            <>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name / order…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-4 py-1.5 rounded-full text-gray-800 text-xs outline-none w-52 bg-white"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg text-gray-800 text-xs outline-none bg-white font-semibold"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="active">Active (AI)</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg text-gray-800 text-xs outline-none bg-white font-semibold"
              >
                <option value="">All Types</option>
                <option value="ticket">Tickets</option>
                <option value="chat">Chats</option>
              </select>
              <button onClick={fetchInbox} className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
                <RefreshCw size={13} /> Refresh
              </button>
            </>
          }
        />

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="animate-spin text-teal-600" size={28} />
              <p className="text-gray-400 text-xs">Loading inbox…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <InboxIcon size={36} className="mx-auto mb-3 text-gray-200" />
              <p className="font-semibold text-sm">Inbox is empty.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-brand text-white">
                  <tr>
                    {["Type", "From / Subject", "Category", "Order ID", "Status", "Last Activity", "Action"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map((it) => (
                    <tr
                      key={it.key}
                      onClick={() => (it.kind === "ticket" ? setViewingTicketId(it.id) : setViewingChatSession(it.raw))}
                      className="hover:bg-gray-50 transition-colors text-gray-700 cursor-pointer"
                    >
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                          it.kind === "ticket" ? "bg-indigo-100 text-indigo-700" : "bg-purple-100 text-purple-700"
                        }`}>
                          {it.kind === "ticket" ? "Ticket" : "Chat"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-800 max-w-xs truncate">{it.title}</td>
                      <td className="px-4 py-2.5 capitalize whitespace-nowrap">
                        {it.subtitle ? (
                          <span className="text-gray-600">{it.subtitle.replace(/_/g, " ")}</span>
                        ) : (
                          <span className="text-gray-300 italic normal-case">No category</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-mono whitespace-nowrap">
                        {it.order_code || it.order_id ? (
                          <span className="text-gray-600">{it.order_code || `#${it.order_id}`}</span>
                        ) : (
                          <span className="text-gray-300 italic font-sans">No order</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <StatusBadge status={it.status} label={it.statusLabel} />
                      </td>
                      <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">{fmtDateTime(it.recency)}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <button
                          onClick={(e) => { e.stopPropagation(); it.kind === "ticket" ? setViewingTicketId(it.id) : setViewingChatSession(it.raw); }}
                          className="flex items-center gap-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-lg font-semibold transition-colors"
                        >
                          <MessageSquare size={11} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && total > 0 && (
            <Pagination
              page={page}
              total={total}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
          )}
        </div>
      </div>
    </>
  );
}
