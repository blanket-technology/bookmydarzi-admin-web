import { AlertCircle, RefreshCw, Search, X, CheckCircle2, Clock, XCircle, Truck } from "lucide-react";
import PageHeader from "../../../components/common/PageHeader.jsx";
import Pagination from "../../../components/common/Pagination.jsx";
import PaymentDetailModal from "../../../components/common/PaymentDetailModal.jsx";
import RefundModal from "../components/RefundModal.jsx";
import StatusOverrideModal from "../components/StatusOverrideModal.jsx";
import PaymentsTable from "../components/PaymentsTable.jsx";
import { PAYMENT_STATUS_FILTER_OPTIONS } from "../constants/paymentConstants.js";
import usePayments from "../hooks/usePayments.js";

// Group a raw payment/settlement status into the four states an ops team
// scans for. Used by the KPI summary row (computed from the loaded rows -
// no extra request, and no revenue figures so it's safe for every role).
function bucketOf(order) {
  const s = (order.SettlementStatus || order.PaymentStatus || "").toLowerCase();
  if (s === "fully_paid" || s === "advance_paid") return "paid";
  if (s === "advance_failed") return "failed";
  if (s === "cod_pending") return "cod";
  return "pending";
}

function KpiCard({ icon: Icon, label, value, tone }) {
  const tones = {
    paid: "text-emerald-600 bg-emerald-50 border-emerald-100",
    pending: "text-amber-600 bg-amber-50 border-amber-100",
    failed: "text-rose-600 bg-rose-50 border-rose-100",
    cod: "text-blue-600 bg-blue-50 border-blue-100",
  };
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 ${tones[tone]}`}>
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-lg font-bold text-gray-800 leading-tight [font-variant-numeric:tabular-nums]">{value}</p>
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  const {
    orders,
    total,
    loading,
    error,
    page,
    limit,
    filterStatus,
    search,
    canManage,
    refundOrderId,
    detailOrderId,
    overrideOrderId,
    syncingOrderId,
    setPage,
    setSearch,
    setRefundOrderId,
    setDetailOrderId,
    setOverrideOrderId,
    fetchOrders,
    syncPayment,
    handleLimitChange,
    handleFilterStatusChange,
    isRefundable,
  } = usePayments();

  // Status breakdown across the current page's orders. A quick at-a-glance
  // health strip (Paid / Pending / Failed / COD) like fintech ops dashboards.
  const counts = (orders || []).reduce(
    (acc, o) => { acc[bucketOf(o)] += 1; return acc; },
    { paid: 0, pending: 0, failed: 0, cod: 0 },
  );

  const hasActiveFilters = Boolean(search || filterStatus);

  return (
    <>
      {refundOrderId && (
        <RefundModal
          orderId={refundOrderId}
          onClose={() => setRefundOrderId(null)}
          onDone={fetchOrders}
        />
      )}
      {detailOrderId && (
        <PaymentDetailModal
          orderId={detailOrderId}
          orderCode={orders.find((o) => o.Id === detailOrderId)?.OrderCode}
          onClose={() => setDetailOrderId(null)}
        />
      )}
      {overrideOrderId && (
        <StatusOverrideModal
          orderId={overrideOrderId}
          onClose={() => setOverrideOrderId(null)}
          onDone={fetchOrders}
        />
      )}
      <div className="p-3 sm:p-5 w-full min-h-screen bg-gray-100">
        <PageHeader
          title="Payments"
          subtitle={`${total} order${total !== 1 ? "s" : ""} · payment status & refund management`}
        />

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 mb-4 flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search order code / name / mobile…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-lg text-gray-800 text-sm outline-none border-2 border-gray-200 focus:border-teal-500 bg-gray-50 focus:bg-white transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <select
            value={filterStatus}
            onChange={(e) => handleFilterStatusChange(e.target.value)}
            className="px-3 py-2 rounded-lg text-gray-700 text-sm outline-none border-2 border-gray-200 focus:border-teal-500 bg-gray-50 focus:bg-white font-semibold transition-colors min-w-[170px]"
          >
            {PAYMENT_STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {hasActiveFilters && (
            <button
              onClick={() => { setSearch(""); handleFilterStatusChange(""); }}
              className="text-xs font-semibold text-gray-400 hover:text-gray-600 px-2"
            >
              Clear filters
            </button>
          )}
          <button
            onClick={fetchOrders}
            className="flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ml-auto"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
            <AlertCircle size={16} />{error}
            <button onClick={fetchOrders} className="ml-auto underline font-semibold">Retry</button>
          </div>
        )}

        {!loading && (orders || []).length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <KpiCard icon={CheckCircle2} label="Paid" value={counts.paid} tone="paid" />
            <KpiCard icon={Clock} label="Pending" value={counts.pending} tone="pending" />
            <KpiCard icon={XCircle} label="Failed" value={counts.failed} tone="failed" />
            <KpiCard icon={Truck} label="Pay on Delivery" value={counts.cod} tone="cod" />
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <PaymentsTable
            orders={orders}
            loading={loading}
            canManage={canManage}
            onViewDetail={setDetailOrderId}
            onRefund={setRefundOrderId}
            onSync={syncPayment}
            onOverride={setOverrideOrderId}
            syncingOrderId={syncingOrderId}
            isRefundable={isRefundable}
          />
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
