import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Package, MapPin, CreditCard, Scissors, Clock,
  CheckCircle2, XCircle, Loader2, AlertTriangle, User, Ruler,
  Truck,
} from "lucide-react";
import api from "../../../services/api";
import { extractErrorMessage } from "../../../utils/formatters";
import { paymentStatusLabel } from "../../payments/constants/paymentConstants.js";

// Mirrors the real backend order_status.py / employee.py transitions exactly
// - previously this file used a fictional status model (cloth_pickup_pending,
// cloth_picked_up, cloth_at_hub, measurement_updated, customer_verified,
// stitching_in_progress, stitching_completed) that never matched any actual
// backend status string, so every action button past "Accepted" called an
// endpoint that either 404'd (verify-customer, start-stitching,
// complete-stitching don't exist) or silently never matched the real status.
const STATUS_LABELS = {
  pending_payment: "Pending Payment",
  payment_failed: "Payment Failed",
  order_placed: "Order Placed",
  order_accepted: "Accepted",
  order_rejected: "Rejected",
  searching_tailor: "Finding Tailor",
  broadcasted: "Broadcast Active",
  tailor_assigned: "Tailor Assigned",
  pickup_scheduled: "Pickup Scheduled",
  pickup_pending: "Pickup Pending",
  picked_up: "Cloth Picked Up",
  cloth_received_by_tailor: "With Tailor",
  stitching_started: "Stitching Started",
  in_progress: "Stitching In Progress",
  final_check: "Final Check",
  ready_for_dispatch: "Ready for Dispatch",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
};

// Linear order used by the progress timeline - broadcast statuses collapse
// into one "Finding Tailor" step since an order can resolve straight from
// searching_tailor to tailor_assigned without ever being "broadcasted".
const TIMELINE_STATUSES = [
  ["order_placed", "Placed"],
  ["order_accepted", "Accepted"],
  ["pickup_pending", "Pickup"],
  ["picked_up", "Picked Up"],
  ["tailor_assigned", "Tailor"],
  ["cloth_received_by_tailor", "With Tailor"],
  ["in_progress", "Stitching"],
  ["ready_for_dispatch", "Ready"],
  ["out_for_delivery", "Delivery"],
  ["delivered", "Delivered"],
];

const STATUS_BADGE = {
  delivered: "bg-emerald-100 text-emerald-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
  order_rejected: "bg-rose-100 text-rose-700",
  payment_failed: "bg-rose-100 text-rose-700",
  out_for_delivery: "bg-blue-100 text-blue-700",
  tailor_assigned: "bg-indigo-100 text-indigo-700",
  stitching_started: "bg-purple-100 text-purple-700",
  in_progress: "bg-purple-100 text-purple-700",
  final_check: "bg-violet-100 text-violet-700",
  ready_for_dispatch: "bg-violet-100 text-violet-700",
  cloth_received_by_tailor: "bg-orange-100 text-orange-700",
  picked_up: "bg-orange-100 text-orange-700",
  pickup_pending: "bg-amber-100 text-amber-700",
  pickup_scheduled: "bg-amber-100 text-amber-700",
  searching_tailor: "bg-sky-100 text-sky-700",
  broadcasted: "bg-sky-100 text-sky-700",
  order_accepted: "bg-teal-100 text-teal-700",
  order_placed: "bg-yellow-100 text-yellow-700",
  pending_payment: "bg-yellow-100 text-yellow-700",
};

const PICKUP_TYPES = [
  { value: "instant", label: "Go Now (Instant)", desc: "Employee leaves immediately to pick up cloth" },
  { value: "scheduled", label: "Pre-Arranged (Scheduled)", desc: "Pickup time already agreed with customer" },
];

const MEASURE_INIT = {
  profile_name: "", gender: "male", chest: "", waist: "", hips: "",
  shoulder: "", neck: "", sleeve_length: "", inseam: "", height: "",
  fit_preference: "regular", notes: "",
};

function InfoRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between items-start py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide w-36 shrink-0">{label}</span>
      <span className="text-sm text-gray-800 font-medium text-right flex-1">{value}</span>
    </div>
  );
}

function Card({ icon: Icon, title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-1">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-100 mb-3">
        <Icon size={18} className="text-teal-600" />
        <h2 className="font-bold text-gray-800">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function BridgeFullDetailsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: routeOrderId } = useParams();
  const { order: seedOrder, from } = location.state || {};

  const [order, setOrder] = useState(seedOrder || null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  // Modals
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [pickupType, setPickupType] = useState("instant");
  const [showMeasureModal, setShowMeasureModal] = useState(false);
  const [measureForm, setMeasureForm] = useState(MEASURE_INIT);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentAmount, setPaymentAmount] = useState("");

  // Load full detail snapshot
  const fetchDetail = useCallback(async (orderId) => {
    if (!orderId) return;
    setDetailLoading(true);
    try {
      const res = await api.get(`/employee/orders/${orderId}`);
      setDetail(res.data);
      setOrder(res.data.order || order);
    } catch {
      // detail is optional - fall back to seed data gracefully
    } finally {
      setDetailLoading(false);
    }
  }, []); // eslint-disable-line

  // The URL param is the source of truth (works on refresh/direct link);
  // location.state.order is only an optional prefetch seed. setState happens
  // inside fetchDetail's async handlers, not synchronously in the effect body.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const targetId = routeOrderId || seedOrder?.Id;
    if (targetId) fetchDetail(targetId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeOrderId, seedOrder?.Id]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Run any employee action
  const runAction = async (fn, reloadId) => {
    setActionLoading(true);
    setMsg(null);
    try {
      const res = await fn();
      const newOrder = res.data?.order || res.data;
      if (newOrder?.Id) setOrder(newOrder);
      if (res.data?.warning) {
        setMsg({ type: "warning", text: res.data.warning });
      } else {
        setMsg({ type: "success", text: res.data?.message || "Done." });
      }
      await fetchDetail(reloadId || newOrder?.Id || order?.Id);
    } catch (err) {
      setMsg({ type: "error", text: extractErrorMessage(err, "Action failed.") });
    } finally {
      setActionLoading(false);
    }
  };

  const act = (endpoint, body = {}) =>
    runAction(() => api.patch(`/employee/orders/${order.Id}/${endpoint}`, body));

  const handleMeasurement = async (e) => {
    e.preventDefault();
    setShowMeasureModal(false);
    const payload = {};
    Object.entries(measureForm).forEach(([k, v]) => {
      if (v !== "" && v !== null) payload[k] = typeof v === "string" && !isNaN(v) && k !== "profile_name" && k !== "gender" && k !== "fit_preference" && k !== "notes" ? Number(v) : v;
    });
    await runAction(() => api.post(`/employee/orders/${order.Id}/measurement`, payload));
  };

  const handleSchedulePickup = async () => {
    setShowPickupModal(false);
    await runAction(() =>
      api.patch(`/employee/orders/${order.Id}/schedule-pickup`, { pickup_type: pickupType })
    );
  };

  // POST (not PATCH like act()) - collect-payment creates a new Payment row
  // rather than transitioning order status. Backend only accepts this while
  // Order.Status === out_for_delivery (app/api/v1/endpoints/employee.py) -
  // "Mark as Delivered" below is disabled until this succeeds and zeroes the
  // remaining balance, since complete_order 400s if RemainingAmount > 0.
  const handleCollectPayment = async () => {
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      setMsg({ type: "error", text: "Enter a valid amount to collect." });
      return;
    }
    setShowPaymentModal(false);
    await runAction(() =>
      api.post(`/employee/orders/${order.Id}/collect-payment`, {
        method: paymentMethod,
        amount,
      })
    );
  };

  // Advances a tailor-assigned order through the stitching stages, using the
  // same PATCH /admin/orders/{id}/status endpoint the admin panel's own
  // action resolver uses (orderActions.js) - now open to EMPLOYEE too (see
  // app/api/v1/endpoints/admin.py's admin_update_order_status), scoped
  // server-side to orders actually assigned to this employee.
  const advanceStatus = (status) =>
    runAction(() => api.patch(`/admin/orders/${order.Id}/status`, { status }));

  if (!order) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-gray-500">
          <Package size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-semibold">No order selected</p>
          <button onClick={() => navigate(-1)} className="mt-3 text-teal-600 underline text-sm">Go Back</button>
        </div>
      </div>
    );
  }

  const status = (order.Status || "").toLowerCase();
  const badge = STATUS_BADGE[status] || "bg-gray-100 text-gray-700";
  const terminal = ["delivered", "completed", "cancelled", "order_rejected"].includes(status);
  const d = detail;

  return (
    <>
      {/* Pickup Type Modal */}
      {showPickupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-bold text-gray-800 text-lg mb-4">Select Pickup Type</h3>
            <div className="space-y-3 mb-5">
              {PICKUP_TYPES.map((pt) => (
                <label key={pt.value} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer ${pickupType === pt.value ? "border-teal-600 bg-teal-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <input type="radio" value={pt.value} checked={pickupType === pt.value} onChange={() => setPickupType(pt.value)} className="mt-0.5 accent-teal-600" />
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{pt.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{pt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPickupModal(false)} className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold">Cancel</button>
              <button onClick={handleSchedulePickup} className="flex-1 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Measurement Modal */}
      {showMeasureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-gray-800 text-lg mb-4">Collect Measurements</h3>
            <form onSubmit={handleMeasurement} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Profile Name *</label>
                  <input required value={measureForm.profile_name} onChange={(e) => setMeasureForm({ ...measureForm, profile_name: e.target.value })} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400" placeholder="e.g. Home Wear" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Gender</label>
                  <select value={measureForm.gender} onChange={(e) => setMeasureForm({ ...measureForm, gender: e.target.value })} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {["chest", "waist", "hips", "shoulder", "neck", "sleeve_length", "inseam", "height"].map((field) => (
                  <div key={field}>
                    <label className="text-xs font-semibold text-gray-600 block mb-1 capitalize">{field.replace("_", " ")} (in)</label>
                    <input type="number" step="0.5" min="0" value={measureForm[field]} onChange={(e) => setMeasureForm({ ...measureForm, [field]: e.target.value })} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400" placeholder="0" />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Fit Preference</label>
                <select value={measureForm.fit_preference} onChange={(e) => setMeasureForm({ ...measureForm, fit_preference: e.target.value })} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none">
                  <option value="slim">Slim Fit</option>
                  <option value="regular">Regular Fit</option>
                  <option value="loose">Loose Fit</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Notes</label>
                <textarea rows={2} value={measureForm.notes} onChange={(e) => setMeasureForm({ ...measureForm, notes: e.target.value })} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none resize-none" placeholder="Any special requirements..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowMeasureModal(false)} className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold">Save Measurements</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-bold text-gray-800 text-lg mb-4">Collect Payment</h3>
            <div className="space-y-3 mb-5">
              {[
                { value: "cash", label: "Cash" },
                { value: "qr", label: "QR / UPI" },
              ].map((m) => (
                <label key={m.value} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer ${paymentMethod === m.value ? "border-teal-600 bg-teal-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <input type="radio" value={m.value} checked={paymentMethod === m.value} onChange={() => setPaymentMethod(m.value)} className="accent-teal-600" />
                  <span className="font-semibold text-sm text-gray-800">{m.label}</span>
                </label>
              ))}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Amount collected (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
                  placeholder="0"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPaymentModal(false)} className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold">Cancel</button>
              <button onClick={handleCollectPayment} className="flex-1 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold">Confirm</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto p-4 pb-10 space-y-4">
        {/* Header */}
        <div className="bg-brand text-white rounded-2xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl font-bold">{order.OrderCode || order.OrderNumber || `#${order.Id}`}</h1>
              <p className="text-teal-200 text-xs mt-0.5">{from === "queue" ? "Order Queue" : "Bridge"} · Employee Workflow</p>
            </div>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${badge}`}>
            {STATUS_LABELS[status] || order.StatusLabel || order.Status}
          </span>
        </div>

        {/* Progress Timeline */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 overflow-x-auto">
          <div className="flex items-center gap-0 min-w-max">
            {TIMELINE_STATUSES.map(([s, label], i, arr) => {
              const timelineOrder = TIMELINE_STATUSES.map(([st]) => st);
              const currentIdx = timelineOrder.indexOf(status);
              const thisIdx = timelineOrder.indexOf(s);
              const done = currentIdx > thisIdx || status === s;
              const active = status === s;
              return (
                <div key={s} className="flex items-center">
                  <div className={`flex flex-col items-center ${active ? "scale-110" : ""}`}>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${active ? "border-teal-600 bg-teal-600" : done ? "border-teal-400 bg-teal-400" : "border-gray-200 bg-white"}`}>
                      {(done || active) && <CheckCircle2 size={12} className="text-white" />}
                    </div>
                    <span className={`text-[9px] mt-1 font-semibold ${active ? "text-teal-700" : done ? "text-teal-500" : "text-gray-300"}`}>{label}</span>
                  </div>
                  {i < arr.length - 1 && <div className={`w-6 h-0.5 mb-3 ${done && currentIdx > thisIdx ? "bg-teal-400" : "bg-gray-200"}`} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Message */}
        {msg && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-semibold ${
            msg.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200"
            : msg.type === "warning" ? "bg-amber-50 text-amber-800 border-amber-200"
            : "bg-red-50 text-red-800 border-red-200"
          }`}>
            {msg.type === "success" ? <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
              : msg.type === "warning" ? <AlertTriangle size={18} className="text-amber-500 shrink-0" />
              : <XCircle size={18} className="text-red-500 shrink-0" />}
            {msg.text}
          </div>
        )}

        {/* Workflow Actions */}
        <Card icon={Clock} title="Workflow Actions">
          {actionLoading ? (
            <div className="flex items-center gap-2 text-teal-600 py-2"><Loader2 size={18} className="animate-spin" /><span className="text-sm font-medium">Processing...</span></div>
          ) : terminal ? (
            <p className="text-sm text-gray-400 italic py-2">No further actions - order is {STATUS_LABELS[status] || status}.</p>
          ) : (
            <div className="flex flex-wrap gap-3 py-1">

              {/* 1. Order Placed → Accept or Reject */}
              {status === "order_placed" && (
                <>
                  <button onClick={() => act("accept")} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
                    <CheckCircle2 size={15} /> Accept Order
                  </button>
                  <button onClick={() => act("reject")} className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
                    <XCircle size={15} /> Reject Order
                  </button>
                </>
              )}

              {/* 2. Order Accepted (or Tailor Assigned before pickup was scheduled) →
                   confirm pickup based on what customer already chose. Pickup and the
                   tailor broadcast run in parallel, so the order can reach
                   tailor_assigned with pickup never scheduled - without this branch
                   also matching tailor_assigned, that case fell through to the
                   info-only banner below with no way to move it forward. */}
              {(status === "order_accepted" || status === "tailor_assigned") && (() => {
                const custPickupType = (order.PickupType || order.pickup_type || "").toLowerCase();
                const isScheduled = custPickupType === "scheduled";
                const slot = order.PickupTimeSlot || order.pickup_time_slot;
                const rawAt = order.ScheduledPickupAt || order.scheduled_pickup_at;
                const scheduledStr = rawAt ? new Date(rawAt).toLocaleString() : null;

                if (custPickupType) {
                  // Customer already chose - employee just confirms, no re-selection needed
                  return (
                    <div className="w-full space-y-2">
                      {isScheduled && (
                        <div className="flex items-start gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 text-sm">
                          <Clock size={15} className="text-indigo-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-indigo-700">Scheduled Pickup - customer pre-arranged this</p>
                            {slot && <p className="text-indigo-600 text-xs mt-0.5">Slot: {slot}</p>}
                            {scheduledStr && <p className="text-indigo-600 text-xs">{scheduledStr}</p>}
                            {!slot && !scheduledStr && <p className="text-indigo-500 text-xs">Contact customer to confirm exact time</p>}
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => act("schedule-pickup", { pickup_type: custPickupType })}
                        className={`${isScheduled ? "bg-indigo-600 hover:bg-indigo-700" : "bg-teal-700 hover:bg-teal-800"} text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2`}
                      >
                        <Truck size={15} />
                        {isScheduled ? "Confirm Scheduled Pickup" : "Go Pick Up Now"}
                      </button>
                    </div>
                  );
                }

                // No pickup type set (e.g. admin-created order) - let employee choose
                return (
                  <button onClick={() => setShowPickupModal(true)} className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
                    <Truck size={15} /> Set Pickup Type
                  </button>
                );
              })()}

              {/* 3. Pickup Pending/Scheduled → Confirm Pickup + Collect Measurements
                   (schedule_pickup_employee_order allows entering this track from
                   either order_accepted or tailor_assigned - pickup and the tailor
                   broadcast run in parallel, so a tailor can already be assigned
                   here) */}
              {(status === "pickup_pending" || status === "pickup_scheduled") && (
                <>
                  <button onClick={() => act("pickup")} className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
                    <Package size={15} /> Confirm Pickup
                  </button>
                  <button
                    onClick={() => { setMeasureForm(MEASURE_INIT); setShowMeasureModal(true); }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2"
                  >
                    <Ruler size={15} /> Collect Measurements
                  </button>
                </>
              )}

              {/* 4. Cloth Picked Up → Hand to Tailor (requires a tailor already
                   assigned - if not, the broadcast/assignment banner below shows
                   instead of this button being clickable) */}
              {status === "picked_up" && order.TailorId && (
                <button onClick={() => act("hand-to-tailor")} className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
                  <Scissors size={15} /> Hand Cloth to Tailor
                </button>
              )}
              {status === "picked_up" && !order.TailorId && (
                <div className="w-full flex items-start gap-3 bg-sky-50 border border-sky-200 text-sky-800 px-4 py-3 rounded-xl text-sm">
                  <Loader2 size={16} className="shrink-0 mt-0.5 animate-spin" />
                  <div>
                    <p className="font-bold">Waiting for a tailor</p>
                    <p className="text-xs mt-0.5">Cloth is picked up - hand-off unlocks once a tailor is assigned. Searching automatically, or assign one manually below.</p>
                  </div>
                </div>
              )}

              {/* Broadcast in progress - waiting for tailor (before pickup reaches this stage) */}
              {["searching_tailor", "broadcasted"].includes(status) && (
                <div className="w-full flex items-start gap-3 bg-sky-50 border border-sky-200 text-sky-800 px-4 py-3 rounded-xl text-sm">
                  <Loader2 size={16} className="shrink-0 mt-0.5 animate-spin" />
                  <div>
                    <p className="font-bold">Broadcast in progress</p>
                    <p className="text-xs mt-0.5">Searching for nearby tailors. This updates automatically when a tailor accepts.</p>
                  </div>
                </div>
              )}

              {/* Tailor assigned, cloth not yet picked up - informational note shown
                  alongside the pickup action rendered above. */}
              {status === "tailor_assigned" && (
                <div className="w-full flex items-start gap-3 bg-indigo-50 border border-indigo-200 text-indigo-800 px-4 py-3 rounded-xl text-sm">
                  <Scissors size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Tailor assigned{order.TailorName ? ` - ${order.TailorName}` : ""}</p>
                    <p className="text-xs mt-0.5">Continue with pickup - stitching starts once the cloth is handed over.</p>
                  </div>
                </div>
              )}

              {/* 5-8. cloth_received_by_tailor → stitching_started → in_progress →
                   final_check → ready_for_dispatch. Staff (admin/superadmin/employee)
                   can now drive every stitching stage themselves, not just the
                   tailor - see app/services/orders/order_status_rules.py's
                   ADMIN_STAFF_ROLES bypass and admin.py's admin_update_order_status,
                   which now accepts EMPLOYEE too. */}
              {status === "cloth_received_by_tailor" && (
                <button onClick={() => advanceStatus("stitching_started")} className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
                  <Scissors size={15} /> Start Stitching
                </button>
              )}
              {status === "stitching_started" && (
                <button onClick={() => advanceStatus("in_progress")} className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
                  <Scissors size={15} /> Mark In Progress
                </button>
              )}
              {status === "in_progress" && (
                <button onClick={() => advanceStatus("final_check")} className="bg-violet-700 hover:bg-violet-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 size={15} /> Move to Final Check
                </button>
              )}
              {status === "final_check" && (
                <button onClick={() => advanceStatus("ready_for_dispatch")} className="bg-violet-700 hover:bg-violet-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 size={15} /> Mark Ready for Dispatch
                </button>
              )}

              {/* 9. Ready for Dispatch → Out for Delivery */}
              {status === "ready_for_dispatch" && (
                <button onClick={() => act("delivery")} className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
                  <Truck size={15} /> Out for Delivery
                </button>
              )}

              {/* 10. Out for Delivery → Collect Payment → Delivered */}
              {status === "out_for_delivery" && (() => {
                // pricing.remaining_amount is the authoritative numeric
                // balance (EmployeePricingSnapshot) - order.BalanceDue is
                // just a boolean "can still collect" flag, not an amount.
                const remaining = Number(d?.pricing?.remaining_amount ?? 0);
                const hasBalance = remaining > 0;
                return (
                  <div className="w-full space-y-3">
                    {hasBalance && (
                      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Balance Due: {order.RemainingAmountDisplay || `₹${remaining}`}</p>
                          <p className="text-xs mt-0.5">Collect payment (Cash / QR) before marking delivered.</p>
                        </div>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3">
                      {hasBalance && (
                        <button
                          onClick={() => {
                            setPaymentAmount(String(remaining));
                            setShowPaymentModal(true);
                          }}
                          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2"
                        >
                          <CreditCard size={15} /> Collect Payment
                        </button>
                      )}
                      <button
                        onClick={() => act("complete")}
                        disabled={hasBalance}
                        title={hasBalance ? "Collect the outstanding balance first" : undefined}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2"
                      >
                        <CheckCircle2 size={15} /> Mark as Delivered
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </Card>

        {/* Order Info */}
        <Card icon={Package} title="Order Details">
          {detailLoading && <p className="text-xs text-gray-400 animate-pulse">Loading full details...</p>}
          <InfoRow label="Order Code" value={order.OrderCode} />
          <InfoRow label="Service" value={d?.service?.name || order.ServiceTitle} />
          <InfoRow label="Category" value={d?.category?.name} />
          <InfoRow label="Cloth" value={order.ClothDetails} />
          <InfoRow label="Notes" value={order.CustomizationNotes} />
          <InfoRow label="Urgency" value={order.UrgencyLevel && order.UrgencyLevel.toLowerCase() !== "standard" ? order.UrgencyLevel : null} />
          <InfoRow label="Base Price" value={d?.service?.base_price ? `₹${d.service.base_price}` : null} />
          <InfoRow label="Total" value={order.AmountDisplay} />
          <InfoRow label="Assigned Employee" value={d?.assigned_employee_id ? `#${d.assigned_employee_id}` : null} />
          <InfoRow
            label="Assigned Tailor"
            value={
              order.TailorId
                ? order.TailorName
                  ? `${order.TailorName} (#${order.TailorId})`
                  : `#${order.TailorId}`
                : "Not assigned"
            }
          />
        </Card>

        {/* Delivery Address */}
        <Card icon={MapPin} title="Pickup / Delivery Address">
          <InfoRow label="Name" value={d?.delivery_address?.full_name || order.address?.full_name} />
          <InfoRow label="Mobile" value={d?.delivery_address?.mobile || order.address?.mobile} />
          <InfoRow label="Address" value={d?.delivery_address?.full_address || order.address?.address_line1} />
          <InfoRow label="City" value={d?.delivery_address?.city || order.address?.city} />
          <InfoRow label="State" value={d?.delivery_address?.state || order.address?.state} />
          <InfoRow label="Pincode" value={d?.delivery_address?.pincode || order.address?.pincode} />
        </Card>

        {/* Payment */}
        <Card icon={CreditCard} title="Payment">
          <InfoRow label="Status" value={paymentStatusLabel(order.SettlementStatus || order.PaymentStatus)} />
          <InfoRow label="Channel" value={d?.payment?.channel} />
          <InfoRow label="Method" value={d?.payment?.method} />
          <InfoRow label="Advance Paid" value={order.BookingAmount ? `₹${order.BookingAmount}` : null} />
          <InfoRow label="Balance Due" value={order.RemainingAmountDisplay || (order.BalanceDue ? `₹${order.BalanceDue}` : null)} />
          <InfoRow label="Total" value={order.AmountDisplay} />
          {d?.pricing && (
            <>
              <InfoRow label="Subtotal" value={`₹${d.pricing.subtotal}`} />
              <InfoRow label="Discount" value={d.pricing.discount ? `₹${d.pricing.discount}` : null} />
              <InfoRow label="Final" value={`₹${d.pricing.final_amount}`} />
            </>
          )}
        </Card>

        {/* Multi-person line items */}
        {d?.line_items?.length > 0 && (
          <Card icon={User} title="Order Items (Family/Group)">
            {d.line_items.map((item) => (
              <div key={item.order_item_id} className="py-2 border-b border-gray-50 last:border-0">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm text-gray-800">{item.person_name}</span>
                  <span className="text-sm font-bold text-gray-700">₹{item.price}</span>
                </div>
                <p className="text-xs text-gray-400">{item.service_name}{item.gender ? ` · ${item.gender}` : ""}</p>
                {item.measurements?.length > 0 && (
                  <p className="text-xs text-teal-600 mt-0.5">{item.measurements.map((m) => `${m.measurement_name}: ${m.measurement_value}`).join(" · ")}</p>
                )}
              </div>
            ))}
          </Card>
        )}
      </div>
    </>
  );
}
