import { useState } from "react";
import FormModal, { Field, FORM_INPUT_CLASS as inp } from "../../../components/common/FormModal.jsx";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { DEFAULT_RADIUS_KM } from "../constants/serviceAreaConstants.js";
import { buildServiceAreaPayload } from "../utils/serviceAreaUtils.js";

export default function AreaModal({ area, onClose, onSave }) {
  const isEdit = !!area;
  const [form, setForm] = useState({
    name: area?.name ?? "",
    latitude: area?.latitude ?? "",
    longitude: area?.longitude ?? "",
    radius_km: area?.radius_km ?? DEFAULT_RADIUS_KM,
    is_active: area?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = buildServiceAreaPayload(form);
      await onSave(payload, isEdit ? area.id : null);
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, "Save failed."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormModal
      title={isEdit ? "Edit Service Area" : "New Service Area"}
      onClose={onClose}
      onSubmit={handleSave}
      submitLabel={isEdit ? "Save Changes" : "Create"}
      submitting={saving}
      message={error ? { type: "error", text: error } : null}
    >
      <Field label="Name" required>
        <input required className={inp} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Gaur City, Greater Noida West" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Latitude" required>
          <input required type="number" step="0.0000001" min={-90} max={90} className={inp} value={form.latitude} onChange={(e) => set("latitude", e.target.value)} placeholder="28.5921" />
        </Field>
        <Field label="Longitude" required>
          <input required type="number" step="0.0000001" min={-180} max={180} className={inp} value={form.longitude} onChange={(e) => set("longitude", e.target.value)} placeholder="77.4419" />
        </Field>
      </div>
      <Field label="Radius (km)" required hint="Customers whose delivery address falls within this radius of the pin above can place orders.">
        <input required type="number" min={1} max={200} className={inp} value={form.radius_km} onChange={(e) => set("radius_km", e.target.value)} />
      </Field>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} className="rounded" />
        Active
      </label>
    </FormModal>
  );
}
