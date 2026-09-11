import { useState } from "react";
import { X } from "lucide-react";
import FormModal, { Field } from "../../../components/common/FormModal.jsx";
import ImageUploadField from "../../../components/common/ImageUploadField.jsx";
import AddonsManagerPanel from "./AddonsManagerPanel.jsx";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { INPUT_CLASS as inp, TEXTAREA_CLASS as tinp, CATALOG_IMAGE_UPLOAD_PATH } from "../constants/catalogConstants.js";
import * as catalogService from "../services/catalogService.js";

/**
 * One shared add/edit form for all three catalog levels (category, service
 * line, service/tier) - replaces CategoryModal, ServiceLineModal, and
 * StitchTypeModal, which were near-identical copies of the same form. The
 * only real differences between levels are: which fields to show (price/
 * delivery-days/premium only apply to a service), which create/update
 * service function to call, and what parent context to attach on create.
 *
 * level: "category" | "line" | "service"
 * parent: { categoryId, categoryName } for a line, or
 *         { categoryId, lineId, lineName } for a service. Unused for a
 *         category (top level, no parent).
 */
function ModalTabs({ tab, setTab }) {
  return (
    <div className="flex gap-1 p-1 rounded-xl bg-gray-100 mb-4">
      {[
        { id: "details", label: "Details" },
        { id: "addons", label: "Add-ons" },
      ].map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setTab(t.id)}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            tab === t.id ? "bg-white text-teal-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export default function CatalogItemModal({ level, initial, parent, onClose, onSaved }) {
  const isEdit = !!initial;
  const isService = level === "service";
  // Add-ons only make sense for an existing, already-saved service - a
  // brand-new unsaved item has no service_id yet to attach add-ons to.
  const showAddonsTab = isService && isEdit;
  const [tab, setTab] = useState("details");

  const [form, setForm] = useState({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    image_url: initial?.image_url ?? "",
    display_order: initial?.display_order ?? 0,
    is_active: initial?.is_active ?? true,
    base_price: initial?.base_price ?? 0,
    estimated_delivery_days: initial?.estimated_delivery_days ?? 7,
    is_premium: initial?.is_premium ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const titleByLevel = {
    category: isEdit ? "Edit Category" : "New Category",
    line: isEdit ? "Edit Sub-category" : "New Sub-category",
    service: isEdit ? "Edit Item" : "New Item",
  };
  const subtitleByLevel = {
    category: undefined,
    line: parent?.categoryName ? `in ${parent.categoryName}` : undefined,
    service: parent?.lineName ? `in ${parent.lineName}` : undefined,
  };
  const namePlaceholderByLevel = {
    category: undefined,
    line: "e.g. Shirt, Blazer, Trouser",
    service: "e.g. Normal Shirt, Designer Shirt",
  };

  const handleSave = async (e) => {
    e.preventDefault();
    // A cleared/blank price input coerces to Number("") = 0, which isn't
    // caught by the input's HTML min="0" on a programmatic submit - without
    // this check a real bookable service could silently save at ₹0.
    if (level === "service" && !(Number(form.base_price) > 0)) {
      setError("Base price must be greater than ₹0.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const base = {
        name: form.name,
        description: form.description,
        image_url: form.image_url,
        display_order: Number(form.display_order),
        is_active: form.is_active,
      };

      if (level === "category") {
        const res = isEdit
          ? await catalogService.updateCategory(initial.id, base)
          : await catalogService.createCategory(base);
        onSaved(res);
      } else if (level === "line") {
        const payload = { ...base, category_id: Number(initial?.category_id ?? parent.categoryId) };
        const res = isEdit
          ? await catalogService.updateServiceLine(initial.id, payload)
          : await catalogService.createServiceLine(payload);
        onSaved(res);
      } else {
        const payload = {
          ...base,
          base_price: Number(form.base_price),
          estimated_delivery_days: Number(form.estimated_delivery_days),
          is_premium: !!form.is_premium,
          category_id: Number(parent.categoryId),
          service_line_id: parent.lineId ? Number(parent.lineId) : null,
        };
        const res = isEdit
          ? await catalogService.updateService(initial.service_id, payload)
          : await catalogService.createService(payload);
        onSaved(res);
      }
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, "Save failed."));
    } finally {
      setSaving(false);
    }
  };

  if (showAddonsTab && tab === "addons") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-800">{titleByLevel[level]}</h2>
              {subtitleByLevel[level] && <p className="text-xs text-gray-400 mt-0.5">{subtitleByLevel[level]}</p>}
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 shrink-0">
              <X size={16} className="text-gray-400" />
            </button>
          </div>
          <ModalTabs tab={tab} setTab={setTab} />
          <AddonsManagerPanel serviceId={initial.service_id} />
        </div>
      </div>
    );
  }

  return (
    <FormModal
      title={titleByLevel[level]}
      subtitle={subtitleByLevel[level]}
      onClose={onClose}
      onSubmit={handleSave}
      submitLabel={isEdit ? "Save Changes" : "Create"}
      submitting={saving}
      message={error ? { type: "error", text: error } : null}
    >
      {showAddonsTab && <ModalTabs tab={tab} setTab={setTab} />}

      <Field label="Name" required>
        <input
          required
          className={inp}
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder={namePlaceholderByLevel[level]}
        />
      </Field>
      <Field label="Description">
        <textarea rows={2} className={tinp} value={form.description} onChange={(e) => set("description", e.target.value)} />
      </Field>
      <Field label="Image">
        <ImageUploadField value={form.image_url} onChange={(v) => set("image_url", v)} uploadPath={CATALOG_IMAGE_UPLOAD_PATH} />
      </Field>

      {isService && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Base Price (₹)" required>
            <input required type="number" min="0" className={inp} value={form.base_price} onChange={(e) => set("base_price", e.target.value)} />
          </Field>
          <Field label="Delivery Days">
            <input type="number" min="1" className={inp} value={form.estimated_delivery_days} onChange={(e) => set("estimated_delivery_days", e.target.value)} />
          </Field>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Display Order">
          <input type="number" min="0" className={inp} value={form.display_order} onChange={(e) => set("display_order", e.target.value)} />
        </Field>
        <Field label="Status">
          <select className={inp} value={form.is_active} onChange={(e) => set("is_active", e.target.value === "true")}>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </Field>
      </div>

      {isService && (
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input type="checkbox" className="w-4 h-4 rounded accent-teal-700" checked={!!form.is_premium} onChange={(e) => set("is_premium", e.target.checked)} />
          <span className="text-sm font-medium text-gray-700">
            Premium <span className="text-xs text-gray-400 font-normal">(routes directly to Premium Hub)</span>
          </span>
        </label>
      )}
    </FormModal>
  );
}
