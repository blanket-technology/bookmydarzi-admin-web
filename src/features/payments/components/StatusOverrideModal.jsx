import { useState, useEffect } from "react";
import FormModal, { Field, FORM_INPUT_CLASS as inp } from "../../../components/common/FormModal.jsx";
import LoadingState from "../../../components/common/LoadingState.jsx";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { STATUS_BADGE, OVERRIDE_STATUSES } from "../constants/paymentConstants.js";
import { buildStatusOverridePayload, getPaymentId } from "../utils/paymentUtils.js";
import * as paymentService from "../services/paymentService.js";

export default function StatusOverrideModal({ orderId, onClose, onDone }) {
  const [payment, setPayment] = useState(null);
  const [loadingPayment, setLoadingPayment] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [status, setStatus] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const pmt = await paymentService.getPaymentByOrderId(orderId);
        setPayment(pmt);
        setStatus((pmt?.Status || "").toLowerCase() || "pending");
      } catch (err) {
        setFetchError(extractErrorMessage(err, "Could not load payment details."));
      } finally {
        setLoadingPayment(false);
      }
    };
    load();
  }, [orderId]);

  const pmtId = getPaymentId(payment);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (fetchError) { onClose(); return; }
    if (!pmtId) return;
    setSubmitting(true);
    setSubmitError("");
    setForbidden(false);
    try {
      const payload = buildStatusOverridePayload(status, transactionId, notes);
      await paymentService.overridePaymentStatus(pmtId, payload);
      onDone();
      onClose();
    } catch (err) {
      if (err.response?.status === 403) {
        setForbidden(true);
      } else {
        setSubmitError(extractErrorMessage(err, "Status override failed."));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingPayment) {
    return (
      <FormModal title="Override Payment Status" onClose={onClose} onSubmit={(e) => e.preventDefault()} submitLabel="Override Status" submitting>
        <LoadingState compact />
      </FormModal>
    );
  }

  const message = fetchError
    ? { type: "error", text: fetchError }
    : forbidden
    ? { type: "error", text: "You need superadmin role to override payment status." }
    : submitError
    ? { type: "error", text: submitError }
    : null;

  return (
    <FormModal
      title="Override Payment Status"
      subtitle="Requires superadmin privileges"
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={fetchError ? "Close" : "Override Status"}
      submitting={submitting}
      message={message}
    >
      {!fetchError && (
        <>
          <div className="bg-gray-50 rounded-xl p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Payment Code</span>
              <span className="font-mono font-semibold text-gray-700">{payment?.PaymentCode || `#${pmtId}`}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Current Status</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[(payment?.Status || "").toLowerCase()] || "bg-gray-100 text-gray-600"}`}>
                {payment?.Status}
              </span>
            </div>
          </div>

          <Field label="New Status">
            <select
              className={inp}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              required
            >
              {OVERRIDE_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>

          {status === "success" && (
            <Field label="Transaction ID" required>
              <input
                type="text"
                className={inp}
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Razorpay / gateway transaction ID"
                required
              />
            </Field>
          )}

          <Field label="Notes (optional)">
            <input
              type="text"
              maxLength={500}
              className={inp}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for override"
            />
          </Field>
        </>
      )}
    </FormModal>
  );
}
