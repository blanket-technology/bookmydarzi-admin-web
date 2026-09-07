import { useState } from "react";
import FormModal, { Field, FORM_INPUT_CLASS as inp } from "../../../components/common/FormModal.jsx";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { BROADCAST_TYPES, TARGET_ROLES } from "../constants/notificationConstants.js";
import { typeLabel } from "../utils/notificationUtils.js";
import { sendBroadcast } from "../services/notificationService.js";

export default function BroadcastModal({ onClose, onSent }) {
  const [form, setForm] = useState({ title: "", body: "", type: "promo", target_role: "user" });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const res = await sendBroadcast(form);
      onSent(res);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to send broadcast."));
    } finally {
      setSending(false);
    }
  };

  return (
    <FormModal
      title="Send Broadcast Notification"
      onClose={onClose}
      onSubmit={submit}
      submitLabel="Send"
      submitting={sending}
      message={error ? { type: "error", text: error } : null}
    >
      <Field label="Send To" required>
        <select
          value={form.target_role}
          onChange={(e) => setForm((f) => ({ ...f, target_role: e.target.value }))}
          className={inp}
        >
          {TARGET_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </Field>
      <Field label="Type">
        <select
          value={form.type}
          onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
          className={inp}
        >
          {BROADCAST_TYPES.map((t) => <option key={t} value={t}>{typeLabel(t)}</option>)}
        </select>
      </Field>
      <Field label="Title" required>
        <input
          required
          maxLength={160}
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="e.g. New Year Offer!"
          className={inp}
        />
      </Field>
      <Field label="Message" required>
        <textarea
          required
          rows={3}
          maxLength={1000}
          value={form.body}
          onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          placeholder="Notification message…"
          className={inp + " resize-none"}
        />
      </Field>
    </FormModal>
  );
}
