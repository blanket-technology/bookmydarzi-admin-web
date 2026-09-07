import { useState } from "react";
import { CalendarClock, CalendarOff, Truck, X } from "lucide-react";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { notifyError, notifySuccess } from "../../../services/dialogService.js";
import { rescheduleOrderPickup } from "../services/orderActionsService.js";

// A pickup can only be moved while it's actually on the books
// (pickup_scheduled/pickup_pending) - everywhere else there's either no
// pickup time yet to move, or it's already been collected. Each state gets
// its own plain-language explanation instead of one generic "wrong status"
// warning, since these aren't errors - they're just different, expected
// points in an order's life.
function rescheduleUnavailableReason(status) {
  const PRE_PICKUP = new Set([
    "order_placed", "order_accepted", "searching_tailor", "broadcasted", "tailor_assigned",
  ]);
  if (PRE_PICKUP.has(status)) {
    return {
      icon: CalendarOff,
      title: "No pickup scheduled yet",
      body: "This order hasn't reached the pickup step yet, so there's nothing to reschedule. Once a pickup time is set, you'll be able to move it from here.",
    };
  }
  return {
    icon: Truck,
    title: "Pickup already collected",
    body: "The clothes for this order have already been picked up, so the pickup time can no longer be changed.",
  };
}

const SLOTS = [
  "8:00 AM – 10:00 AM",
  "10:00 AM – 12:00 PM",
  "12:00 PM – 2:00 PM",
  "2:00 PM – 4:00 PM",
  "4:00 PM – 6:00 PM",
  "6:00 PM – 8:00 PM",
];

function toLocalInputValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function RescheduleModal({ order, onClose, onDone }) {
  const [dateTime, setDateTime] = useState(toLocalInputValue(order.ScheduledPickupAt));
  const [slot, setSlot] = useState(order.PickupTimeSlot || SLOTS[1]);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const canReschedule = order.Status === "pickup_scheduled" || order.Status === "pickup_pending";

  const submit = async () => {
    if (!dateTime) {
      notifyError("Pick a new pickup date and time.");
      return;
    }
    const iso = new Date(dateTime).toISOString();
    if (new Date(iso) <= new Date()) {
      notifyError("The new pickup time must be in the future.");
      return;
    }
    setSaving(true);
    try {
      await rescheduleOrderPickup(order.Id, { scheduledPickupAt: iso, pickupTimeSlot: slot, reason });
      notifySuccess(`Pickup for ${order.OrderCode || `#${order.Id}`} rescheduled.`);
      onDone?.();
    } catch (err) {
      notifyError(extractErrorMessage(err, "Couldn't reschedule this pickup."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CalendarClock size={16} className="text-teal-600" />
            <h3 className="text-sm font-bold text-slate-800">Reschedule pickup</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {!canReschedule ? (() => {
            const { icon: Icon, title, body } = rescheduleUnavailableReason(order.Status);
            return (
              <div className="flex flex-col items-center text-center gap-2.5 py-4 px-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <Icon size={18} className="text-slate-400" />
                </div>
                <p className="text-sm font-bold text-slate-700">{title}</p>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs">{body}</p>
              </div>
            );
          })() : (
            <>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  New date &amp; time
                </label>
                <input
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Time slot
                </label>
                <select
                  value={slot}
                  onChange={(e) => setSlot(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                >
                  {SLOTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Reason (optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  placeholder="e.g. Customer requested a later slot"
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100">
          {canReschedule ? (
            <>
              <button
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg text-slate-500 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={saving}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-teal-700 hover:bg-teal-800 disabled:bg-teal-200 text-white"
              >
                {saving ? "Saving…" : "Reschedule pickup"}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
