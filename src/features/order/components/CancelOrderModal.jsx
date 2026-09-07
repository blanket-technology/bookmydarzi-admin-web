import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";

export default function CancelOrderModal({ order, onClose, onConfirm, submitting }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
            <Trash2 size={18} className="text-rose-600" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-800">Cancel Order</h3>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{order.OrderCode || `#${order.Id}`}</p>
          </div>
        </div>
        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Reason (required)</label>
        <textarea
          rows={3}
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why is this order being cancelled?"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-300 resize-none bg-gray-50 focus:bg-white transition-colors mb-4"
        />
        <div className="flex gap-3">
          <button onClick={onClose} disabled={submitting} className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">
            Keep Order
          </button>
          <button
            onClick={() => onConfirm(reason.trim())}
            disabled={submitting || !reason.trim()}
            className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {submitting ? "Cancelling…" : "Cancel Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
