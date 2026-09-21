import { useState } from "react";
import FormModal, { Field, FORM_INPUT_CLASS as inp } from "../../../components/common/FormModal.jsx";
import { extractErrorMessage } from "../../../utils/formatters.js";
import * as payoutService from "../services/payoutService.js";

export default function MarkPaidModal({ payout, onClose, onDone }) {
  const [payoutReference, setPayoutReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!payoutReference.trim()) {
      setError("A payout reference (bank UTR / transaction ref) is required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await payoutService.markPayoutPaid(payout.id, {
        payout_reference: payoutReference.trim(),
        notes: notes.trim() || undefined,
      });
      onDone();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to mark payout as paid."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormModal
      title="Mark Payout Paid"
      subtitle={payout.order_code || `Order #${payout.order_id}`}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel="Mark Paid"
      submitting={submitting}
      message={error ? { type: "error", text: error } : null}
    >
      <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Tailor</span>
          <span className="font-semibold text-gray-800">{payout.tailor_name || `#${payout.tailor_id}`}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Order amount</span>
          <span className="font-semibold text-gray-800">₹{Number(payout.order_amount).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Commission</span>
          <span className="font-semibold text-gray-800">{Number(payout.commission_percent).toFixed(2)}%</span>
        </div>
        <div className="flex justify-between text-sm border-t border-gray-200 pt-1.5">
          <span className="text-gray-700 font-semibold">Payout amount</span>
          <span className="font-bold text-emerald-700">₹{Number(payout.payout_amount).toFixed(2)}</span>
        </div>
      </div>

      <Field label="Payout reference (bank UTR / transaction ref)" required>
        <input
          required
          className={inp}
          value={payoutReference}
          onChange={(e) => setPayoutReference(e.target.value)}
          placeholder="e.g. UTR2026091812345"
          autoFocus
        />
      </Field>
      <Field label="Notes (optional)">
        <input
          className={inp}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Paid via NEFT on 21 Sep"
        />
      </Field>
    </FormModal>
  );
}
