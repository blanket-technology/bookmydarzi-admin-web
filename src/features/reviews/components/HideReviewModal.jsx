import { useState } from "react";
import { AlertCircle, EyeOff, X } from "lucide-react";

export default function HideReviewModal({ review, onClose, onConfirm, loading, error }) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center">
              <EyeOff size={15} className="text-rose-600" />
            </div>
            <h3 className="font-bold text-gray-800">Hide review</h3>
          </div>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
        </div>

        <div className="bg-gray-50 rounded-xl p-3 mb-4">
          <p className="text-sm text-gray-700 italic">&ldquo;{review.comment}&rdquo;</p>
          <p className="mt-1 text-xs text-gray-400">
            {review.customer_name || "Customer"} · {review.rating}★ · Order {review.order_code || `#${review.order_id}`}
          </p>
        </div>

        <p className="text-xs text-gray-500 mb-2">
          This hides the review from the website and app immediately, and excludes its rating from the
          tailor/service's average score. Reversible - you can unhide it later.
        </p>

        <textarea
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional, for your own records)"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-rose-400 mb-3"
        />

        {error && (
          <div className="flex items-center gap-2 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl px-3 py-2 mb-3 text-xs">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason.trim() || undefined)}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {loading ? "Hiding…" : "Hide review"}
          </button>
        </div>
      </div>
    </div>
  );
}
