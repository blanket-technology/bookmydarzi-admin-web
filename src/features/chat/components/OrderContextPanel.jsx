import { useCallback, useEffect, useState } from "react";
import { CalendarClock, ChevronDown, ChevronUp, Package, Ruler, RefreshCw } from "lucide-react";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { notifyError } from "../../../services/dialogService.js";
import { getOrderForAgent } from "../services/orderActionsService.js";
import RescheduleModal from "./RescheduleModal.jsx";
import MeasurementModal from "./MeasurementModal.jsx";

const STATUS_DOT = {
  pickup_scheduled: "bg-amber-400",
  pickup_pending: "bg-amber-400",
  picked_up: "bg-teal-400",
  stitching_started: "bg-violet-400",
  in_progress: "bg-violet-400",
  delivered: "bg-green-400",
  completed: "bg-green-400",
  cancelled: "bg-red-400",
};

function fmtStatus(status) {
  if (!status) return "—";
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtDateTime(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
  });
}

export default function OrderContextPanel({ orderId }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [modal, setModal] = useState(null); // "reschedule" | "measurement" | null

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOrderForAgent(orderId);
      setOrder(data);
    } catch (err) {
      notifyError(extractErrorMessage(err, "Couldn't load order details."));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // Fetch-on-orderId-change; setState happens inside fetchOrder's async
  // handlers, not synchronously in the effect body.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (orderId) fetchOrder();
  }, [orderId, fetchOrder]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!orderId) return null;

  return (
    <div className="border-b border-slate-100 bg-white flex-shrink-0">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left"
      >
        <div className="flex items-center gap-2">
          <Package size={13} className="text-teal-600" />
          <span className="text-xs font-bold text-slate-700">Order context</span>
          {order && (
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[order.Status] || "bg-slate-300"}`} />
          )}
          {order && <span className="text-[11px] text-slate-400">{fmtStatus(order.Status)}</span>}
        </div>
        {collapsed ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronUp size={14} className="text-slate-400" />}
      </button>

      {!collapsed && (
        <div className="px-4 pb-3.5">
          {loading ? (
            <div className="text-[11px] text-slate-400 py-2">Loading order…</div>
          ) : !order ? (
            <div className="text-[11px] text-slate-400 py-2">Order details unavailable.</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] mb-3">
                <div>
                  <span className="text-slate-400">Order</span>
                  <div className="font-semibold text-slate-700">{order.OrderCode || `#${order.Id}`}</div>
                </div>
                <div>
                  <span className="text-slate-400">Amount</span>
                  <div className="font-semibold text-slate-700">{order.AmountDisplay || `₹${order.FinalAmount}`}</div>
                </div>
                {order.ScheduledPickupAt && (
                  <div className="col-span-2">
                    <span className="text-slate-400">Pickup</span>
                    <div className="font-semibold text-slate-700">
                      {fmtDateTime(order.ScheduledPickupAt)}
                      {order.PickupTimeSlot ? ` · ${order.PickupTimeSlot}` : ""}
                    </div>
                  </div>
                )}
                {order.measurement && (
                  <div className="col-span-2">
                    <span className="text-slate-400">Measurement profile</span>
                    <div className="font-semibold text-slate-700">{order.measurement.profile_name}</div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setModal("reschedule")}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border border-slate-200 text-slate-600 hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                >
                  <CalendarClock size={12} />
                  Reschedule pickup
                </button>
                <button
                  onClick={() => setModal("measurement")}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border border-slate-200 text-slate-600 hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                >
                  <Ruler size={12} />
                  {order.measurement ? "Edit measurements" : "Add measurements"}
                </button>
                <button
                  onClick={fetchOrder}
                  title="Refresh order details"
                  className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-semibold rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <RefreshCw size={12} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {modal === "reschedule" && order && (
        <RescheduleModal
          order={order}
          onClose={() => setModal(null)}
          onDone={() => { setModal(null); fetchOrder(); }}
        />
      )}
      {modal === "measurement" && order && (
        <MeasurementModal
          order={order}
          onClose={() => setModal(null)}
          onDone={() => { setModal(null); fetchOrder(); }}
        />
      )}
    </div>
  );
}
