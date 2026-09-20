import { useEffect, useState } from "react";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { formatCurrency } from "../../../utils/formatters.js";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { getAdminCancellationPreview, getOrderCancellationRecord } from "../services/orderService.js";

// Admin cancel now routes through the same penalty-aware engine the
// customer apps use (see cancellation_service.admin_cancel_order) instead of
// the old separate no-penalty/100%-refund force-cancel — this preview
// mirrors what the customer would see for the same order/stage, plus an
// admin-only waiver checkbox that zeroes the penalty for goodwill cancels.
// Mirrors backend's AdminCancelOrderRequest.reason (app/schemas/
// cancellation.py: min_length=5) - previously any non-empty reason
// (even 1 char) enabled the Cancel Order button, and a too-short reason
// 422'd with no field-level indication why.
const MIN_REASON_LENGTH = 5;

export default function CancelOrderModal({ order, onClose, onConfirm, submitting }) {
  const [reason, setReason] = useState("");
  const [waivePenalty, setWaivePenalty] = useState(false);
  // preview/previewError/previewFor move together as one result object keyed
  // by the waivePenalty value it was fetched for, so "loading" is simply
  // "the current waivePenalty doesn't match what we last fetched for" -
  // avoids a bare setState(true) at the top of the effect body.
  const [previewResult, setPreviewResult] = useState({ for: null, data: null, error: "" });
  const loadingPreview = previewResult.for !== waivePenalty;
  const preview = loadingPreview ? null : previewResult.data;
  const previewError = loadingPreview ? "" : previewResult.error;

  // Existing customer-initiated cancellation request for this order, if
  // any - shown so an admin doesn't confirm this separate, independent
  // cancel action without seeing one already sitting in the Cancellations
  // review queue. Best-effort: a failure here just means no banner, never
  // blocks the actual cancel flow.
  const [existingCancellation, setExistingCancellation] = useState(null);
  useEffect(() => {
    let cancelled = false;
    getOrderCancellationRecord(order.Id)
      .then((record) => {
        if (!cancelled) setExistingCancellation(record || null);
      })
      .catch(() => {
        if (!cancelled) setExistingCancellation(null);
      });
    return () => { cancelled = true; };
  }, [order.Id]);

  useEffect(() => {
    let cancelled = false;
    getAdminCancellationPreview(order.Id, waivePenalty)
      .then((data) => {
        if (!cancelled) setPreviewResult({ for: waivePenalty, data, error: "" });
      })
      .catch((err) => {
        if (!cancelled) {
          setPreviewResult({
            for: waivePenalty,
            data: null,
            error: extractErrorMessage(err, "Could not load cancellation preview."),
          });
        }
      });
    return () => { cancelled = true; };
  }, [order.Id, waivePenalty]);

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

        {existingCancellation && ["pending", "approved"].includes(existingCancellation.Status) && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2.5 rounded-xl mb-4 text-xs font-semibold">
            <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
            <span>
              A customer cancellation request ({existingCancellation.CancellationCode ?? `#${existingCancellation.Id}`}
              ) is already {existingCancellation.Status} in the Cancellations queue. This will start a separate,
              independent cancellation.
            </span>
          </div>
        )}

        {loadingPreview ? (
          <div className="flex items-center justify-center py-6 text-gray-400 text-sm gap-2 mb-4">
            <Loader2 size={16} className="animate-spin" /> Loading refund details…
          </div>
        ) : previewError ? (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2.5 rounded-xl mb-4 text-xs font-semibold">
            <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
            <span>{previewError}</span>
          </div>
        ) : preview ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gray-500">Payment type</span>
              <span className="font-semibold text-gray-800 capitalize">{preview.payment_type}</span>
            </div>
            {preview.payment_type === "prepaid" && (
              <div className="flex justify-between">
                <span className="text-gray-500">Paid amount</span>
                <span className="font-semibold text-gray-800">{formatCurrency(preview.paid_amount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Penalty</span>
              <span className={`font-semibold ${preview.penalty_amount > 0 ? "text-rose-600" : "text-gray-800"}`}>
                {preview.penalty_amount > 0 ? formatCurrency(preview.penalty_amount) : "None"}
              </span>
            </div>
            {preview.payment_type === "prepaid" ? (
              <div className="flex justify-between pt-1 border-t border-gray-200">
                <span className="text-gray-600 font-semibold">Refund to customer</span>
                <span className="font-bold text-teal-700">{formatCurrency(preview.refund_amount)}</span>
              </div>
            ) : preview.penalty_amount > 0 ? (
              <p className="text-gray-500 pt-1 border-t border-gray-200">
                No upfront payment was collected — this penalty will be applied to the customer's next order.
              </p>
            ) : null}
          </div>
        ) : null}

        {!loadingPreview && preview && preview.penalty_pct > 0 && (
          <label className="flex items-start gap-2 mb-4 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={waivePenalty}
              onChange={(e) => setWaivePenalty(e.target.checked)}
              className="mt-0.5 accent-teal-600"
            />
            <span className="text-xs text-gray-600">
              <span className="font-semibold text-gray-800">Waive penalty</span> — cancel as a goodwill gesture with
              no penalty charged and a full refund of the amount paid.
            </span>
          </label>
        )}

        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Reason (required)</label>
        <textarea
          rows={3}
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why is this order being cancelled?"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-300 resize-none bg-gray-50 focus:bg-white transition-colors"
        />
        {reason.trim().length > 0 && reason.trim().length < MIN_REASON_LENGTH && (
          <p className="text-xs text-rose-600 font-semibold mt-1 mb-3">Reason must be at least {MIN_REASON_LENGTH} characters.</p>
        )}
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} disabled={submitting} className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">
            Keep Order
          </button>
          <button
            onClick={() => onConfirm(reason.trim(), waivePenalty)}
            disabled={submitting || reason.trim().length < MIN_REASON_LENGTH || loadingPreview}
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
