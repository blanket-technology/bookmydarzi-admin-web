import { Loader2, RotateCcw, RefreshCw, SlidersHorizontal } from "lucide-react";
import StatusBadge from "../../../components/common/StatusBadge.jsx";

const RECONCILABLE_STATUSES = new Set(["initiated", "pending", "advance_pending"]);

export default function PaymentsTable({
  orders,
  loading,
  canManage,
  onViewDetail,
  onRefund,
  onSync,
  onOverride,
  syncingOrderId,
  isRefundable,
}) {
  // The Actions column only earns its place when at least one row on this
  // page actually has an action to offer - otherwise every cell would just
  // be empty padding. Row count stays consistent for colSpan either way.
  const hasAnyAction = canManage && orders.length > 0;
  const columnCount = hasAnyAction ? 6 : 5;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-brand text-white">
          <tr>
            <th className="px-4 py-2.5 text-left font-semibold">Order Code</th>
            <th className="px-4 py-2.5 text-left font-semibold">Service</th>
            <th className="px-4 py-2.5 text-left font-semibold">Total</th>
            <th className="px-4 py-2.5 text-left font-semibold">Balance Due</th>
            <th className="px-4 py-2.5 text-left font-semibold">Payment Status</th>
            {hasAnyAction && <th className="px-4 py-2.5 text-center font-semibold">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {loading ? (
            <tr><td colSpan={columnCount} className="text-center py-10"><Loader2 className="animate-spin mx-auto text-teal-600" size={24} /></td></tr>
          ) : orders.length === 0 ? (
            <tr><td colSpan={columnCount} className="text-center py-10 text-gray-400 font-medium">No payment records found</td></tr>
          ) : (
            orders.map((order) => (
              <tr
                key={order.Id}
                onClick={() => onViewDetail(order.Id)}
                className="hover:bg-gray-50 transition-colors text-gray-700 cursor-pointer"
              >
                <td className="px-4 py-2.5 font-mono font-semibold text-teal-700 whitespace-nowrap">
                  {order.OrderCode || order.OrderNumber}
                </td>
                <td className="px-4 py-2.5 text-gray-500">{order.ServiceTitle || "-"}</td>
                <td className="px-4 py-2.5 font-semibold">{order.AmountDisplay || `₹${order.FinalAmount}`}</td>
                <td className="px-4 py-2.5 text-gray-500">
                  {order.BalanceDue ? order.RemainingAmountDisplay || `₹${order.RemainingAmount}` : "-"}
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge
                    status={(order.SettlementStatus || "").toLowerCase()}
                    label={order.PaymentStatusLabel || order.SettlementStatus || "-"}
                  />
                </td>
                {hasAnyAction && (
                  <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      {canManage && isRefundable(order) && (
                        <button onClick={() => onRefund(order.Id)} title="Issue refund" className="flex items-center gap-1 px-2 py-1 text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg font-semibold">
                          <RotateCcw size={11} /> Refund
                        </button>
                      )}
                      {canManage && RECONCILABLE_STATUSES.has((order.SettlementStatus || "").toLowerCase()) && (
                        <button
                          onClick={() => onSync(order.Id)}
                          disabled={syncingOrderId === order.Id}
                          title="Re-check payment status with the gateway"
                          className="flex items-center gap-1 px-2 py-1 text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg font-semibold disabled:opacity-60"
                        >
                          <RefreshCw size={11} className={syncingOrderId === order.Id ? "animate-spin" : ""} /> Sync
                        </button>
                      )}
                      {canManage && (
                        <button onClick={() => onOverride(order.Id)} title="Manually override payment status (superadmin)" className="flex items-center gap-1 px-2 py-1 text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-lg font-semibold">
                          <SlidersHorizontal size={11} /> Override
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
