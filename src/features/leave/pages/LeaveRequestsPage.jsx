import { Calendar, RefreshCw, ChevronRight, AlertTriangle } from "lucide-react";
import PageHeader from "../../../components/common/PageHeader.jsx";
import LoadingState from "../../../components/common/LoadingState.jsx";
import StatusBadge from "../../../components/common/StatusBadge.jsx";
import LeaveReviewModal from "../components/LeaveReviewModal.jsx";
import useLeaveRequests from "../hooks/useLeaveRequests.js";
import { ROLE_FILTER_OPTIONS, STATUS_FILTER_OPTIONS } from "../constants/leaveConstants.js";

function fmtDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-IN", { dateStyle: "medium" });
}

export default function LeaveRequestsPage() {
  const {
    items,
    total,
    page,
    statusFilter,
    roleFilter,
    loading,
    error,
    selectedId,
    totalPages,
    actionLoading,
    actionError,
    setPage,
    setStatusFilter,
    setRoleFilter,
    setSelectedId,
    approve,
    reject,
    fetchLeaveRequests,
  } = useLeaveRequests();

  const selected = items.find((i) => i.Id === selectedId) || null;

  return (
    <div className="p-3 sm:p-5 w-full min-h-screen bg-gray-100">
      <PageHeader
        title="Leave Requests"
        subtitle={`${total} total request${total !== 1 ? "s" : ""}`}
        actions={
          <>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg text-gray-800 text-xs outline-none bg-white font-semibold"
            >
              {STATUS_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg text-gray-800 text-xs outline-none bg-white font-semibold"
            >
              {ROLE_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button
              onClick={fetchLeaveRequests}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </>
        }
      />

      {error && (
        <div className="flex items-center gap-2 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl px-4 py-3 mb-4 text-sm">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Calendar size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-semibold">No leave requests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Requested by", "Role", "Dates", "Reason", "Status", "Requested on", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map((item) => (
                  <tr key={item.Id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                      {item.UserName || `User #${item.UserId}`}
                      <div className="text-xs text-slate-400 font-normal">{item.UserMobile || ""}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 capitalize whitespace-nowrap">
                      {item.Role === "employee" ? "Bridge" : item.Role}
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {fmtDate(item.StartDate)} — {fmtDate(item.EndDate)}
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-[220px] truncate">{item.Reason || "-"}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={item.Status} label={item.Status} /></td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{fmtDate(item.CreatedAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedId(item.Id)}
                        className="flex items-center gap-1 text-teal-600 hover:text-teal-800 text-xs font-semibold"
                      >
                        <ChevronRight size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-slate-50"
            >Prev</button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 border rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-slate-50"
            >Next</button>
          </div>
        </div>
      )}

      {selected && (
        <LeaveReviewModal
          request={selected}
          onClose={() => setSelectedId(null)}
          onApprove={(notes) => approve(selected.Id, notes)}
          onReject={(notes) => reject(selected.Id, notes)}
          loading={actionLoading}
          error={actionError}
        />
      )}
    </div>
  );
}
