import {
  MessageSquare,
  Loader2,
  AlertCircle,
  RefreshCw,
  Search,
} from "lucide-react";
import PageHeader from "../../../components/common/PageHeader.jsx";
import Pagination from "../../../components/common/Pagination.jsx";
import StatusBadge from "../../../components/common/StatusBadge.jsx";
import TicketModal from "../../../components/common/TicketModal.jsx";
import useSupportTickets from "../hooks/useSupportTickets.js";
import { TICKET_STATUSES, TICKET_STATUS_LABEL } from "../constants/supportConstants.js";
import { fmtDate } from "../utils/supportUtils.js";

export default function SupportTicketsPage() {
  const {
    tickets,
    total,
    loading,
    error,
    page,
    limit,
    statusFilter,
    search,
    viewingId,
    setPage,
    setSearch,
    setViewingId,
    handleFilterChange,
    handleLimitChange,
    fetchTickets,
    updateTicketStatus,
  } = useSupportTickets();

  return (
    <>
      {viewingId && (
        <TicketModal
          ticketId={viewingId}
          onClose={() => setViewingId(null)}
          onStatusChanged={updateTicketStatus}
        />
      )}

      <div className="p-3 sm:p-5 w-full min-h-screen bg-gray-100">
        <PageHeader
          title="Support Tickets"
          subtitle={`${total} ticket${total !== 1 ? "s" : ""}`}
          actions={
            <>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search ticket code / subject…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-4 py-1.5 rounded-full text-gray-800 text-xs outline-none w-52 bg-white"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg text-gray-800 text-xs outline-none bg-white font-semibold"
              >
                <option value="">All Statuses</option>
                {TICKET_STATUSES.map((s) => <option key={s} value={s}>{TICKET_STATUS_LABEL[s]}</option>)}
              </select>
              <button onClick={fetchTickets} className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
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
              <p className="text-gray-400 text-xs">Loading tickets…</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <MessageSquare size={36} className="mx-auto mb-3 text-gray-200" />
              <p className="font-semibold text-sm">No tickets found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-brand text-white">
                  <tr>
                    {["Ticket Code", "Subject", "Category", "Order #", "Status", "Created", "Action"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50 transition-colors text-gray-700">
                      <td className="px-4 py-2.5 font-mono font-bold text-teal-700 whitespace-nowrap">
                        {ticket.ticket_code ?? `#${ticket.id}`}
                      </td>
                      <td className="px-4 py-2.5 text-gray-800 max-w-xs truncate">{ticket.subject}</td>
                      <td className="px-4 py-2.5 text-gray-500 capitalize whitespace-nowrap">{ticket.category}</td>
                      <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{ticket.order_id ? `#${ticket.order_id}` : "-"}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <StatusBadge status={ticket.status} label={TICKET_STATUS_LABEL[ticket.status] ?? ticket.status} />
                      </td>
                      <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">{fmtDate(ticket.created_at)}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <button
                          onClick={() => setViewingId(ticket.id)}
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
              onLimitChange={handleLimitChange}
            />
          )}
        </div>
      </div>
    </>
  );
}
