import { useState } from "react";
import FormModal, { Field } from "../../../components/common/FormModal.jsx";
import ImageUploadField from "../../../components/common/ImageUploadField.jsx";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { INPUT_CLASS as inp, TEXTAREA_CLASS as tinp, CATALOG_IMAGE_UPLOAD_PATH } from "../constants/catalogConstants.js";
import * as catalogService from "../services/catalogService.js";

export default function CategoryModal({ initial, onClose, onSaved }) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    name: initial?.name ?? "", description: initial?.description ?? "",
    image_url: initial?.image_url ?? "", display_order: initial?.display_order ?? 0,
    is_active: initial?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const payload = { ...form, display_order: Number(form.display_order) };
      const res = isEdit
        ? await catalogService.updateCategory(initial.id, payload)
        : await catalogService.createCategory(payload);
      onSaved(res); onClose();
    } catch (err) { setError(extractErrorMessage(err, "Save failed.")); }
    finally { setSaving(false); }
  };

  return (
    <FormModal
      title={isEdit ? "Edit Category" : "New Category"}
      onClose={onClose}
      onSubmit={handleSave}
      submitLabel={isEdit ? "Save Changes" : "Create"}
      submitting={saving}
      message={error ? { type: "error", text: error } : null}
    >
      <Field label="Name" required><input required className={inp} value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
      <Field label="Description"><textarea rows={2} className={tinp} value={form.description} onChange={(e) => set("description", e.target.value)} /></Field>
      <Field label="Image"><ImageUploadField value={form.image_url} onChange={(v) => set("image_url", v)} uploadPath={CATALOG_IMAGE_UPLOAD_PATH} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Display Order"><input type="number" min="0" className={inp} value={form.display_order} onChange={(e) => set("display_order", e.target.value)} /></Field>
        <Field label="Status">
          <select className={inp} value={form.is_active} onChange={(e) => set("is_active", e.target.value === "true")}>
            <option value="true">Active</option><option value="false">Inactive</option>
          </select>
        </Field>
      </div>
    </FormModal>
  );
}
