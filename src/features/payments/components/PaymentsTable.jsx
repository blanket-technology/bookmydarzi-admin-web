import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, RotateCcw, RefreshCw, SlidersHorizontal, ChevronRight, CreditCard } from "lucide-react";
import StatusBadge from "../../../components/common/StatusBadge.jsx";
import { paymentStatusLabel } from "../constants/paymentConstants.js";
import { applySort, nextSortState } from "../../../utils/tableSort.js";

const RECONCILABLE_STATUSES = new Set(["initiated", "pending", "advance_pending"]);

const SORT_ACCESSORS = {
  order: (o) => o.OrderCode || o.OrderNumber || "",
  service: (o) => o.ServiceTitle || "",
  total: (o) => Number(o.FinalAmount) || 0,
  balance: (o) => (o.BalanceDue ? Number(o.RemainingAmount) || 0 : -1),
  status: (o) => paymentStatusLabel(o.SettlementStatus) || o.SettlementStatus || "",
};

function SortIcon({ direction }) {
  if (direction === "asc") return <ArrowUp size={12} className="shrink-0" />;
  if (direction === "desc") return <ArrowDown size={12} className="shrink-0" />;
  return <ArrowUpDown size={12} className="shrink-0 opacity-40" />;
}

function SortableHeader({ label, sortKey, align, sort, onSort }) {
  const active = sort?.key === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      className={`px-4 py-3 font-semibold cursor-pointer select-none hover:bg-white/10 transition-colors ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      <span className={`inline-flex items-center gap-1 ${align === "right" ? "justify-end" : ""}`}>
        {label}
        <SortIcon direction={active ? sort.direction : null} />
      </span>
    </th>
  );
}

function IconButton({ onClick, title, tone, spinning, disabled, children }) {
  const tones = {
    blue: "text-blue-600 hover:bg-blue-50",
    gray: "text-gray-500 hover:bg-gray-100",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${tones[tone]}`}
    >
      <span className={spinning ? "block animate-spin" : "block"}>{children}</span>
    </button>
  );
}

export default function PaymentsTable({
  orders,
  loading,
  page = 1,
  limit = 20,
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
  const columnCount = (hasAnyAction ? 6 : 5) + 1; // +1 for S.No.
  const rowOffset = (Math.max(1, page) - 1) * limit;

  const [sort, setSort] = useState(null);
  const handleSort = (key) => setSort((prev) => nextSortState(prev, key));
  const sortedOrders = useMemo(
    () => applySort(orders, sort, sort ? SORT_ACCESSORS[sort.key] : undefined),
    [orders, sort],
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-brand text-white">
          <tr>
            <th className="px-4 py-3 text-center font-semibold">S.No.</th>
            <SortableHeader label="Order" sortKey="order" sort={sort} onSort={handleSort} />
            <SortableHeader label="Service" sortKey="service" sort={sort} onSort={handleSort} />
            <SortableHeader label="Total" sortKey="total" align="right" sort={sort} onSort={handleSort} />
            <SortableHeader label="Balance Due" sortKey="balance" align="right" sort={sort} onSort={handleSort} />
            <SortableHeader label="Payment Status" sortKey="status" sort={sort} onSort={handleSort} />
            {hasAnyAction && <th className="px-4 py-3 text-center font-semibold">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {loading ? (
            <tr><td colSpan={columnCount} className="text-center py-14"><Loader2 className="animate-spin mx-auto text-teal-600" size={24} /></td></tr>
          ) : orders.length === 0 ? (
            <tr>
              <td colSpan={columnCount} className="text-center py-14">
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gray-50">
                  <CreditCard size={20} className="text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-400">No payment records found</p>
              </td>
            </tr>
          ) : (
            sortedOrders.map((order, i) => {
              const hasBalance = order.BalanceDue && Number(order.RemainingAmount) > 0;
              return (
                <tr
                  key={order.Id}
                  onClick={() => onViewDetail(order.Id)}
                  className="group hover:bg-gray-50 transition-colors text-gray-700 cursor-pointer"
                >
                  <td className="px-4 py-3 text-center text-gray-400 font-mono text-[11px]">{rowOffset + i + 1}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-teal-700">{order.OrderCode || order.OrderNumber}</span>
                      <ChevronRight size={13} className="text-gray-300 group-hover:text-teal-500 transition-colors" />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-[220px] truncate">{order.ServiceTitle || "-"}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800 text-right tabular-nums whitespace-nowrap">
                    {order.AmountDisplay || `₹${order.FinalAmount}`}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                    {hasBalance ? (
                      <span className="font-semibold text-amber-600">{order.RemainingAmountDisplay || `₹${order.RemainingAmount}`}</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={(order.SettlementStatus || "").toLowerCase()}
                      label={paymentStatusLabel(order.SettlementStatus)}
                    />
                  </td>
                  {hasAnyAction && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        {canManage && isRefundable(order) ? (
                          <button
                            onClick={() => onRefund(order.Id)}
                            title="Issue refund"
                            className="flex items-center gap-1 px-2.5 py-1.5 text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg font-semibold transition-colors"
                          >
                            <RotateCcw size={12} /> Refund
                          </button>
                        ) : (
                          <span className="w-[74px]" />
                        )}
                        {canManage && RECONCILABLE_STATUSES.has((order.SettlementStatus || "").toLowerCase()) && (
                          <IconButton
                            onClick={() => onSync(order.Id)}
                            disabled={syncingOrderId === order.Id}
                            spinning={syncingOrderId === order.Id}
                            title="Re-check payment status with the gateway"
                            tone="blue"
                          >
                            <RefreshCw size={13} />
                          </IconButton>
                        )}
                        {canManage && (
                          <IconButton onClick={() => onOverride(order.Id)} title="Manually override payment status (superadmin)" tone="gray">
                            <SlidersHorizontal size={13} />
                          </IconButton>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
