import { useState } from "react";
import FormModal, { Field } from "../../../components/common/FormModal.jsx";
import ImageUploadField from "../../../components/common/ImageUploadField.jsx";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { INPUT_CLASS as inp, TEXTAREA_CLASS as tinp, CATALOG_IMAGE_UPLOAD_PATH } from "../constants/catalogConstants.js";
import * as catalogService from "../services/catalogService.js";

export default function StitchTypeModal({ initial, categoryId, serviceLineId, serviceLineName, onClose, onSaved }) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    name: initial?.name ?? "", description: initial?.description ?? "",
    image_url: initial?.image_url ?? "", base_price: initial?.base_price ?? 0,
    estimated_delivery_days: initial?.estimated_delivery_days ?? 7,
    display_order: initial?.display_order ?? 0, is_premium: initial?.is_premium ?? false,
    is_active: initial?.is_active ?? true,
    category_id: categoryId, service_line_id: serviceLineId ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const payload = {
        ...form, base_price: Number(form.base_price),
        estimated_delivery_days: Number(form.estimated_delivery_days),
        display_order: Number(form.display_order), category_id: Number(form.category_id),
        service_line_id: form.service_line_id ? Number(form.service_line_id) : null,
      };
      const res = isEdit
        ? await catalogService.updateService(initial.service_id, payload)
        : await catalogService.createService(payload);
      onSaved(res); onClose();
    } catch (err) { setError(extractErrorMessage(err, "Save failed.")); }
    finally { setSaving(false); }
  };

  return (
    <FormModal
      title={isEdit ? "Edit Item" : "New Item"}
      subtitle={serviceLineName ? `in ${serviceLineName}` : undefined}
      onClose={onClose}
      onSubmit={handleSave}
      submitLabel={isEdit ? "Save Changes" : "Create"}
      submitting={saving}
      message={error ? { type: "error", text: error } : undefined}
    >
      <div className="bg-teal-50 border border-teal-100 rounded-xl px-3 py-2.5 mb-1 text-xs text-teal-800">
        <strong>Naming tip:</strong> Use the format <span className="font-mono bg-teal-100 px-1 rounded">Normal [Type]</span> or <span className="font-mono bg-teal-100 px-1 rounded">Designer [Type]</span> - e.g. "Normal Shirt" or "Designer Shirt". The app groups items by type and shows Normal / Designer as quality options.
      </div>

      <Field label="Name *">
        <input required className={inp} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Normal Shirt, Designer Shirt" />
      </Field>
      <Field label="Description"><textarea rows={2} className={tinp} value={form.description} onChange={(e) => set("description", e.target.value)} /></Field>
      <Field label="Image"><ImageUploadField value={form.image_url} onChange={(v) => set("image_url", v)} uploadPath={CATALOG_IMAGE_UPLOAD_PATH} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Base Price (₹) *"><input required type="number" min="0" className={inp} value={form.base_price} onChange={(e) => set("base_price", e.target.value)} /></Field>
        <Field label="Delivery Days"><input type="number" min="1" className={inp} value={form.estimated_delivery_days} onChange={(e) => set("estimated_delivery_days", e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Display Order"><input type="number" min="0" className={inp} value={form.display_order} onChange={(e) => set("display_order", e.target.value)} /></Field>
        <Field label="Status">
          <select className={inp} value={form.is_active} onChange={(e) => set("is_active", e.target.value === "true")}>
            <option value="true">Active</option><option value="false">Inactive</option>
          </select>
        </Field>
      </div>
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input type="checkbox" className="w-4 h-4 rounded accent-teal-700" checked={!!form.is_premium} onChange={(e) => set("is_premium", e.target.checked)} />
        <span className="text-sm font-medium text-gray-700">
          Premium  <span className="text-xs text-gray-400 font-normal">(routes directly to Premium Hub)</span>
        </span>
      </label>
    </FormModal>
  );
}
