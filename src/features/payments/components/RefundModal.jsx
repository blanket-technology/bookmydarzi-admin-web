import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import FormModal, { Field, FORM_INPUT_CLASS as inp } from "../../../components/common/FormModal.jsx";
import LoadingState from "../../../components/common/LoadingState.jsx";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { STATUS_BADGE } from "../constants/paymentConstants.js";
import {
  buildRefundPayload,
  calculateAlreadyRefunded,
  calculateRefundableAmount,
  getPaymentId,
} from "../utils/paymentUtils.js";
import * as paymentService from "../services/paymentService.js";

export default function RefundModal({ orderId, onClose, onDone }) {
  const [payment, setPayment] = useState(null);
  const [refunds, setRefunds] = useState([]);
  const [loadingPayment, setLoadingPayment] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Manual-refund fallback (failed Razorpay refund, admin already paid the
  // customer themselves) - inline per-row form rather than a second
  // FormModal, since this modal only supports one submit action at a time.
  const [manualTargetId, setManualTargetId] = useState(null);
  const [manualReference, setManualReference] = useState("");
  const [manualNote, setManualNote] = useState("");
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualError, setManualError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [pmtRes] = await Promise.allSettled([
          paymentService.getPaymentByOrderId(orderId),
        ]);

        if (pmtRes.status === "fulfilled") {
          const pmt = pmtRes.value;
          const pmtId = getPaymentId(pmt);
          if (pmtId) {
            try {
              const refundList = await paymentService.getRefunds(pmtId);
              setRefunds(refundList);
              setPayment(pmt);
            } catch (refundErr) {
              // Refund history failed to load - refuse to compute a
              // refundable amount at all rather than silently treating the
              // full original payment as refundable (over-refund risk if
              // this payment already has prior refunds we can't see).
              setFetchError(extractErrorMessage(refundErr, "Could not load refund history - refund is disabled until this can be verified."));
            }
          } else {
            setPayment(pmt);
          }
        } else {
          setFetchError(extractErrorMessage(pmtRes.reason, "Could not load payment details."));
        }
      } catch (err) {
        setFetchError(extractErrorMessage(err, "Could not load payment details."));
      } finally {
        setLoadingPayment(false);
      }
    };
    load();
  }, [orderId]);

  const alreadyRefunded = calculateAlreadyRefunded(refunds);
  const refundable = calculateRefundableAmount(payment, refunds);
  const pmtId = getPaymentId(payment);
  const canRefund = payment && payment.Status === "success" && refundable > 0;

  const handleMarkManual = async (refundId) => {
    if (!pmtId || !manualReference.trim()) return;
    setManualSubmitting(true);
    setManualError("");
    try {
      await paymentService.markRefundManual(pmtId, refundId, {
        reference: manualReference.trim(),
        note: manualNote.trim() || undefined,
      });
      setManualTargetId(null);
      setManualReference("");
      setManualNote("");
      // Modal stays open (unlike handleSubmit, which closes after a normal
      // refund) - refetch refund history locally so "Already refunded" and
      // the status badge update in place, not just the parent's order list.
      const refundList = await paymentService.getRefunds(pmtId);
      setRefunds(refundList);
      onDone();
    } catch (err) {
      setManualError(extractErrorMessage(err, "Could not mark as manually refunded."));
    } finally {
      setManualSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pmtId || !canRefund) { onClose(); return; }
    setSubmitting(true);
    setSubmitError("");
    try {
      const payload = buildRefundPayload(amount, reason);
      await paymentService.issueRefund(pmtId, payload);
      onDone();
      onClose();
    } catch (err) {
      setSubmitError(extractErrorMessage(err, "Refund failed."));
    } finally {
      setSubmitting(false);
    }
  };

  // The loading/fetch-error/no-refund-possible states have no submit action -
  // FormModal's own Cancel/Submit footer is only relevant once a refund is
  // actually possible, so those states render as a lightweight custom body
  // (still inside FormModal's shell) rather than forcing its form footer.
  if (loadingPayment) {
    return (
      <FormModal title="Issue Refund" onClose={onClose} onSubmit={(e) => e.preventDefault()} submitLabel="Issue Refund" submitting>
        <LoadingState compact />
      </FormModal>
    );
  }

  return (
    <FormModal
      title="Issue Refund"
      subtitle={payment ? (payment.PaymentCode || `#${pmtId}`) : undefined}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={fetchError || !canRefund ? "Close" : "Issue Refund"}
      submitting={submitting}
      message={
        fetchError
          ? { type: "error", text: fetchError }
          : submitError
          ? { type: "error", text: submitError }
          : null
      }
    >
      {!fetchError && (
        <>
          <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Payment ID</span>
              <span className="font-mono font-semibold text-gray-700">{payment?.PaymentCode || `#${pmtId}`}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total paid</span>
              <span className="font-semibold text-gray-800">₹{parseFloat(payment?.Amount || 0).toFixed(2)}</span>
            </div>
            {alreadyRefunded > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Already refunded</span>
                <span className="font-semibold text-rose-600">−₹{alreadyRefunded.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm border-t border-gray-200 pt-1.5">
              <span className="text-gray-700 font-semibold">Refundable</span>
              <span className="font-bold text-emerald-700">₹{refundable.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Status</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[payment?.Status?.toLowerCase()] || "bg-gray-100 text-gray-600"}`}>
                {payment?.Status}
              </span>
            </div>
          </div>

          {refunds.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5">Refund history</p>
              <div className="space-y-1">
                {refunds.map((r) => (
                  <div key={r.id} className="bg-gray-50 px-3 py-2 rounded-lg text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-gray-500">{r.refund_code || `#${r.id}`}</span>
                      <span className="font-semibold text-gray-700">₹{parseFloat(r.amount).toFixed(2)}</span>
                      <span className={`px-1.5 py-0.5 rounded-full font-semibold ${
                        r.status === "processed" || r.status === "manual_completed"
                          ? "bg-emerald-100 text-emerald-700"
                          : r.status === "failed"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {r.status}
                      </span>
                    </div>
                    {r.status === "manual_completed" && r.manual_reference && (
                      <p className="text-[11px] text-gray-500 mt-1">
                        Manually refunded · ref: <span className="font-mono">{r.manual_reference}</span>
                      </p>
                    )}
                    {r.status === "failed" && manualTargetId !== r.id && (
                      <button
                        type="button"
                        onClick={() => { setManualTargetId(r.id); setManualError(""); }}
                        className="mt-1.5 text-[11px] font-semibold text-teal-700 hover:text-teal-800"
                      >
                        Mark as manually refunded
                      </button>
                    )}
                    {manualTargetId === r.id && (
                      <div className="mt-2 space-y-1.5 border-t border-gray-200 pt-2">
                        <p className="text-[11px] text-gray-500">
                          Use this only after you've already paid the customer yourself (UPI/bank transfer). This does not send money - it just records what you paid.
                        </p>
                        <input
                          type="text"
                          className={inp}
                          placeholder="UPI / bank transaction reference (required)"
                          value={manualReference}
                          onChange={(e) => setManualReference(e.target.value)}
                        />
                        <input
                          type="text"
                          className={inp}
                          placeholder="Note (optional)"
                          value={manualNote}
                          onChange={(e) => setManualNote(e.target.value)}
                        />
                        {manualError && <p className="text-[11px] text-rose-600">{manualError}</p>}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={manualSubmitting || !manualReference.trim()}
                            onClick={() => handleMarkManual(r.id)}
                            className="flex-1 text-[11px] font-semibold bg-teal-600 text-white rounded-lg py-1.5 disabled:opacity-50"
                          >
                            {manualSubmitting ? "Saving..." : "Confirm"}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setManualTargetId(null); setManualReference(""); setManualNote(""); setManualError(""); }}
                            className="flex-1 text-[11px] font-semibold bg-gray-200 text-gray-700 rounded-lg py-1.5"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!canRefund && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-xl text-sm">
              <AlertCircle size={14} />
              {payment?.Status !== "success"
                ? `Payment status is "${payment?.Status}" - only successful payments can be refunded.`
                : "This payment has already been fully refunded."}
            </div>
          )}

          {canRefund && (
            <>
              <Field label={`Amount (leave blank for full ₹${refundable.toFixed(2)})`}>
                <input
                  type="number"
                  min="0.01"
                  max={refundable}
                  step="0.01"
                  className={inp}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Up to ₹${refundable.toFixed(2)}`}
                />
              </Field>
              <Field label="Reason (optional)">
                <input
                  type="text"
                  maxLength={500}
                  className={inp}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Customer cancelled order"
                />
              </Field>
            </>
          )}
        </>
      )}
    </FormModal>
  );
}
