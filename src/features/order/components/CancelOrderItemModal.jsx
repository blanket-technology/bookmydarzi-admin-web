import { useEffect, useState } from "react";
import { X, Loader2, AlertTriangle } from "lucide-react";
import { formatCurrency } from "../../../utils/formatters.js";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { getAdminItemCancellationPreview } from "../services/orderService.js";

// Same quick-pick reasons as the customer-facing cancel modals (web +
// app) and the admin app's cancel sheet - kept identical everywhere so
// this feels like one consistent flow regardless of which app someone is
// cancelling from.
const CANCEL_ITEM_REASONS = [
  "Ordered by mistake",
  "Found a better price elsewhere",
  "No longer needed",
  "Taking too long",
  "Wrong size or measurement",
  "Other",
];

// Per-item sibling of CancelOrderModal.jsx - cancels ONE line item within
// a multi-item order, without cancelling the whole order. Only usable in
// the same self-service-cancellable stages the whole-order flow enforces
// for customers (admin bypasses that gate the same way); blocked
// entirely once that's passed, or when this would be the last remaining
// active item - see item_cancellation_service.py's is_last_active_item
// guard, re-validated server-side regardless of any client-side check.
const MIN_REASON_LENGTH = 5;

export default function CancelOrderItemModal({ orderId, item, onClose, onConfirm, submitting }) {
  const [reason, setReason] = useState("");
  const [selectedReason, setSelectedReason] = useState(null);
  // preview/previewError/previewFor move together as one result object keyed
  // by the (orderId, itemId) pair it was fetched for, so "loading" is simply
  // "the current target doesn't match what we last fetched for" - avoids a
  // bare setState(true) at the top of the effect body (same pattern as
  // CancelOrderModal.jsx's previewResult).
  const [previewResult, setPreviewResult] = useState({ for: null, data: null, error: "" });
  const previewKey = `${orderId}:${item.order_item_id}`;
  const loadingPreview = previewResult.for !== previewKey;
  const preview = loadingPreview ? null : previewResult.data;
  const previewError = loadingPreview ? "" : previewResult.error;

  useEffect(() => {
    let cancelled = false;
    getAdminItemCancellationPreview(orderId, item.order_item_id)
      .then((data) => {
        if (!cancelled) setPreviewResult({ for: previewKey, data, error: "" });
      })
      .catch((err) => {
        if (!cancelled) {
          setPreviewResult({
            for: previewKey,
            data: null,
            error: extractErrorMessage(err, "Could not load cancellation preview."),
          });
        }
      });
    return () => { cancelled = true; };
  }, [orderId, item.order_item_id, previewKey]);

  const blocked = preview ? !preview.cancellation_allowed : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
            <X size={20} className="text-rose-600" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-800">Cancel this item?</h3>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{item.service_name || `Item #${item.order_item_id}`}</p>
          </div>
        </div>

        {loadingPreview ? (
          <div className="flex items-center justify-center py-6 text-gray-400 text-sm gap-2 mb-4">
            <Loader2 size={16} className="animate-spin" /> Loading refund details…
          </div>
        ) : previewError ? (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2.5 rounded-xl mb-4 text-xs font-semibold">
            <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
            <span>{previewError}</span>
          </div>
        ) : preview && blocked ? (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2.5 rounded-xl mb-4 text-xs font-semibold">
            <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
            <span>{preview.cancel_reason || "This item can't be cancelled right now."}</span>
          </div>
        ) : preview ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gray-500">Item price</span>
              <span className="font-semibold text-gray-800">{formatCurrency(preview.item_price)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment type</span>
              <span className="font-semibold text-gray-800 capitalize">{preview.payment_type}</span>
            </div>
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

        {!blocked && (
          <>
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Why is this item being cancelled?</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {CANCEL_ITEM_REASONS.map((option) => {
                const active = selectedReason === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setSelectedReason(active ? null : option);
                      setReason(active ? "" : option === "Other" ? "" : option);
                    }}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-colors ${
                      active
                        ? "bg-gray-900 border-gray-900 text-white"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            <textarea
              rows={3}
              autoFocus={selectedReason === "Other"}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setSelectedReason("Other");
              }}
              placeholder="Why is this item being cancelled?"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-300 resize-none bg-gray-50 focus:bg-white transition-colors"
            />
            {reason.trim().length > 0 && reason.trim().length < MIN_REASON_LENGTH && (
              <p className="text-xs text-rose-600 font-semibold mt-1 mb-3">Reason must be at least {MIN_REASON_LENGTH} characters.</p>
            )}
          </>
        )}
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} disabled={submitting} className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">
            {blocked ? "Close" : "Keep Item"}
          </button>
          {!blocked && (
            <button
              onClick={() => onConfirm(reason.trim())}
              disabled={submitting || reason.trim().length < MIN_REASON_LENGTH || loadingPreview}
              className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {submitting ? "Cancelling…" : "Cancel Item"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
