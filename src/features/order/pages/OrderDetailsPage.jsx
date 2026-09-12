import { AlertCircle, AlertTriangle, Edit2, Trash2, Loader2, RefreshCw, Search, X, SlidersHorizontal } from "lucide-react";
import PageHeader from "../../../components/common/PageHeader";
import Pagination from "../../../components/common/Pagination";
import StatusBadge from "../../../components/common/StatusBadge";
import { formatDate } from "../../../utils/formatters";
import { STATUS_LABELS, TERMINAL_STATUSES } from "../../../utils/orderActions";
import { paymentStatusLabel } from "../../payments/constants/paymentConstants.js";
import { PAYMENT_STATUS_OPTIONS } from "../constants/orderConstants.js";
import { getStatusFilterOptions } from "../utils/orderUtils.js";
import CancelOrderModal from "../components/CancelOrderModal.jsx";
import useOrderList from "../hooks/useOrderList.js";

const STATUS_FILTER_OPTIONS = getStatusFilterOptions();

export default function OrderDetailsPage() {
  const {
    token,
    navigate,
    isTailor,
    isEmployee,
    orders,
    total,
    fetching,
    fetchError,
    filterStatus,
    filterPayment,
    filterTailor,
    dateFrom,
    dateTo,
    needsManualAssignment,
    showFilters,
    search,
    page,
    limit,
    tailors,
    cancelTarget,
    cancelling,
    activeFilterCount,
    setFilterPayment,
    setFilterTailor,
    setDateFrom,
    setDateTo,
    setNeedsManualAssignment,
    setShowFilters,
    setSearch,
    setPage,
    setLimit,
    setCancelTarget,
    fetchOrders,
    confirmCancel,
    clearAdvancedFilters,
    handleFilterStatusChange,
  } = useOrderList();

  if (!token) return null;

  return (
    <div className="p-3 sm:p-5 w-full min-h-screen bg-gray-100">
      {cancelTarget && (
        <CancelOrderModal
          order={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onConfirm={confirmCancel}
          submitting={cancelling}
        />
      )}

      <PageHeader
        title="Order Management"
        subtitle={`${total} order${total !== 1 ? "s" : ""}`}
        actions={
          <>
            {!isTailor && (
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search order code / name / mobile…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-4 py-1.5 rounded-full text-gray-800 text-xs outline-none w-56 bg-white"
                />
              </div>
            )}
            <select
              value={filterStatus}
              onChange={(e) => handleFilterStatusChange(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg text-gray-800 text-xs outline-none bg-white font-semibold min-w-[150px]"
            >
              <option value="">All Statuses</option>
              {STATUS_FILTER_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {!isTailor && (
              <button
                onClick={() => setNeedsManualAssignment(!needsManualAssignment)}
                title="Orders where the tailor broadcast found nobody after every round, including the all-tailor fallback - assign a tailor manually"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  needsManualAssignment
                    ? "bg-rose-600 text-white"
                    : "bg-white/15 hover:bg-white/25 text-white"
                }`}
              >
                <AlertTriangle size={13} /> Needs Tailor
              </button>
            )}
            {!isTailor && (
              <button
                onClick={() => setShowFilters((s) => !s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  activeFilterCount > 0 ? "bg-white text-teal-700" : "bg-white/15 hover:bg-white/25 text-white"
                }`}
              >
                <SlidersHorizontal size={13} /> Filters
                {activeFilterCount > 0 && (
                  <span className="bg-teal-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">{activeFilterCount}</span>
                )}
              </button>
            )}
            <button
              onClick={() => {
                // setPage(1) alone is enough when not already on page 1 - it
                // changes the React Query queryKey, which auto-refetches.
                // Calling refetch() in the same handler used to race that:
                // refetch() closes over THIS render's still-stale page value
                // (React hasn't re-rendered with page=1 yet), so it could
                // refire the old page's query a moment before/after the
                // real one - on page 1 already, neither fired anything
                // different, which read as "Refresh does nothing."
                if (page !== 1) {
                  setPage(1);
                } else {
                  fetchOrders();
                }
              }}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </>
        }
      />

      {!isTailor && showFilters && (
        <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Advanced Filters</p>
            <button
              onClick={() => setShowFilters(false)}
              title="Close filters"
              className="text-gray-400 hover:text-gray-600 p-1 -m-1 rounded-lg hover:bg-gray-100"
            >
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Payment Status</label>
              <select
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg text-gray-800 text-xs outline-none bg-gray-50 border border-gray-200 font-semibold [color-scheme:light]"
              >
                <option value="">All Payments</option>
                {PAYMENT_STATUS_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Tailor</label>
              <select
                value={filterTailor}
                onChange={(e) => setFilterTailor(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg text-gray-800 text-xs outline-none bg-gray-50 border border-gray-200 font-semibold [color-scheme:light]"
              >
                <option value="">All Tailors</option>
                {tailors.map((t) => (
                  <option key={t.tailor_id ?? t.user_id} value={t.tailor_id ?? ""}>{t.full_name || `Tailor ${t.tailor_id}`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg text-gray-800 text-xs outline-none bg-gray-50 border border-gray-200 font-semibold [color-scheme:light]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg text-gray-800 text-xs outline-none bg-gray-50 border border-gray-200 font-semibold [color-scheme:light]"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-4 mt-3 pt-3 border-t border-gray-100">
            {activeFilterCount > 0 && (
              <button onClick={clearAdvancedFilters} className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-rose-600">
                <X size={13} /> Clear filters
              </button>
            )}
            <button
              onClick={() => setShowFilters(false)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {fetchError && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-xl mb-3 text-xs font-semibold">
          <AlertCircle size={14} className="text-amber-500 shrink-0" />
          <span className="flex-1">{fetchError}</span>
          <button onClick={fetchOrders} className="underline font-bold">Retry</button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand text-white">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Order Code</th>
                <th className="px-4 py-3 text-left font-semibold">Customer</th>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-left font-semibold">Service / City</th>
                <th className="px-4 py-3 text-left font-semibold">Tailor</th>
                <th className="px-4 py-3 text-left font-semibold">Payment</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {fetching ? (
                <tr>
                  <td colSpan={8} className="text-center py-10">
                    <Loader2 className="animate-spin mx-auto text-teal-600" size={24} />
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400 font-medium">
                    {needsManualAssignment
                      ? "No orders currently need manual tailor assignment."
                      : `No orders found${filterStatus ? ` with status "${STATUS_LABELS[filterStatus] || filterStatus.replace(/_/g, " ")}"` : ""}.`}
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.Id}
                    onClick={() => navigate(`/orders/${order.Id}`, { state: { order } })}
                    className={`transition-colors text-gray-700 cursor-pointer ${
                      order.NeedsManualAssignment ? "bg-rose-50/60 hover:bg-rose-50" : "hover:bg-teal-50/40"
                    }`}
                  >
                    <td className="px-4 py-3 font-mono font-bold text-teal-700 whitespace-nowrap">
                      {order.OrderCode || order.OrderNumber || `#${order.Id}`}
                    </td>
                    <td className="px-4 py-3 max-w-[160px]">
                      <div className="font-semibold text-gray-800 truncate">{order.address?.full_name || "-"}</div>
                      {order.address?.mobile && (
                        <div className="text-gray-400 text-xs">{order.address.mobile}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-gray-700">{formatDate(order.CreatedAt)}</div>
                      {order.DeliveryLabel && (
                        <div className="text-teal-600 text-xs">{order.DeliveryLabel}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-600">{order.ServiceTitle || order.ServiceName || "-"}</div>
                      {order.UrgencyLevel && order.UrgencyLevel.toLowerCase() !== "standard" && (
                        <div className="text-[10px] uppercase font-bold text-amber-600">{order.UrgencyLevel}</div>
                      )}
                      {order.address?.city && (
                        <div className="text-xs text-gray-400">{order.address.city}{order.address.state ? `, ${order.address.state}` : ""}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[130px]">
                      <div className="text-gray-700 truncate">{order.TailorName || <span className="text-gray-300">Unassigned</span>}</div>
                      {order.NeedsManualAssignment && (
                        <div className="flex items-center gap-1 text-rose-600 text-[10px] font-bold uppercase tracking-wide mt-0.5">
                          <AlertTriangle size={10} /> No tailor found
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800">{order.AmountDisplay || "-"}</div>
                      <div className="text-gray-400 text-xs">{paymentStatusLabel(order.SettlementStatus || order.PaymentStatus)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={(order.Status || "").toLowerCase()}
                        label={order.StatusLabel || STATUS_LABELS[(order.Status || "").toLowerCase()] || (order.Status || "").replace(/_/g, " ")}
                      />
                    </td>
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => navigate(`/orders/${order.Id}`, { state: { order } })}
                          className="p-1.5 text-blue-600 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100"
                          title="View / Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        {!isTailor && !isEmployee && !TERMINAL_STATUSES.has((order.Status || "").toLowerCase()) && (
                          <button
                            onClick={() => setCancelTarget(order)}
                            className="p-1.5 text-rose-600 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100"
                            title="Cancel Order"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!fetching && total > 0 && (
          <Pagination
            page={page}
            total={total}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
          />
        )}
      </div>
    </div>
  );
}
