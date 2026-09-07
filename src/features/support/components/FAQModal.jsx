import { useState } from "react";
import { Trash2 } from "lucide-react";
import FormModal, { Field, FORM_INPUT_CLASS as inp } from "../../../components/common/FormModal.jsx";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { FAQ_CATEGORIES } from "../constants/supportConstants.js";

export default function FAQModal({ initial, onClose, onSave }) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    question: initial?.question ?? "",
    answer: initial?.answer ?? "",
    category: initial?.category ?? "general",
    sort_order: initial?.sort_order ?? 0,
    is_active: initial?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, sort_order: Number(form.sort_order) };
      await onSave(payload, isEdit ? initial.id : null);
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, "Save failed."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormModal
      title={isEdit ? "Edit FAQ" : "New FAQ"}
      onClose={onClose}
      onSubmit={handleSave}
      submitLabel={isEdit ? "Save Changes" : "Create FAQ"}
      submitting={saving}
      message={error ? { type: "error", text: error } : null}
      maxWidth="max-w-lg"
    >
      <Field label="Question" required>
        <input required className={inp} value={form.question} onChange={(e) => set("question", e.target.value)} placeholder="e.g. How do I track my order?" />
      </Field>
      <Field label="Answer" required>
        <textarea required rows={4} className={inp + " resize-none"} value={form.answer} onChange={(e) => set("answer", e.target.value)} placeholder="Write the full answer…" />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Category">
          <select className={inp} value={form.category} onChange={(e) => set("category", e.target.value)}>
            {FAQ_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Sort Order">
          <input type="number" min="0" className={inp} value={form.sort_order} onChange={(e) => set("sort_order", e.target.value)} />
        </Field>
        <Field label="Status">
          <select className={inp} value={form.is_active} onChange={(e) => set("is_active", e.target.value === "true")}>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </Field>
      </div>
    </FormModal>
  );
}

export function FAQDeleteConfirm({ faq, onClose, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const handle = async () => {
    setDeleting(true);
    try {
      await onDelete(faq);
      onClose();
    } catch {
      // onDelete handles alert
    } finally {
      setDeleting(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
            <Trash2 size={18} className="text-rose-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Delete FAQ</h3>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{faq.question}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={deleting} className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold">Cancel</button>
          <button onClick={handle} disabled={deleting} className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold disabled:opacity-60">
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
