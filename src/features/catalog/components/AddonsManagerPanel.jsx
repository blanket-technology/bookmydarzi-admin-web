import { useEffect, useState } from "react";
import { Loader2, Plus, Pencil, Trash2, IndianRupee, AlertCircle } from "lucide-react";
import { FORM_INPUT_CLASS as inp } from "../../../components/common/FormModal.jsx";
import { ConfirmModal } from "../../../components/common/EntityWorkspace.jsx";
import { extractErrorMessage } from "../../../utils/formatters.js";
import * as catalogService from "../services/catalogService.js";

const EMPTY_FORM = { name: "", description: "", price: "", display_order: 0, is_active: true };

/**
 * Manage the optional, separately-priced add-ons for one specific service
 * (e.g. "Shirt Repair" -> Button Replacement, Shoulder Adjustment, Length
 * Shortening) - Zomato-style "add extras" checklist shown to the customer
 * on that service's detail page. Scoped per-service, not per-category, so
 * a shirt's add-ons never leak onto a saree - see backend's
 * ServiceAddon.ServiceId.
 *
 * Pure content, no modal chrome of its own - rendered as the "Add-ons" tab
 * inside CatalogItemModal (previously its own standalone ServiceAddonsModal
 * triggered by a separate tree icon; consolidated here so everything about
 * one item lives in the same place).
 */
export default function AddonsManagerPanel({ serviceId }) {
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null); // null = list view, "new" = create form, or an addon id
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await catalogService.getServiceAddons(serviceId);
      setAddons(data);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load add-ons."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setSaveError("");
    setEditingId("new");
  };

  const openEdit = (addon) => {
    setForm({
      name: addon.name,
      description: addon.description ?? "",
      price: addon.price,
      display_order: addon.display_order ?? 0,
      is_active: addon.is_active,
    });
    setSaveError("");
    setEditingId(addon.id);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!(Number(form.price) >= 0)) {
      setSaveError("Price must be 0 or more.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        price: Number(form.price),
        display_order: Number(form.display_order),
        is_active: !!form.is_active,
      };
      if (editingId === "new") {
        await catalogService.createServiceAddon(serviceId, payload);
      } else {
        await catalogService.updateServiceAddon(serviceId, editingId, payload);
      }
      setEditingId(null);
      await load();
    } catch (err) {
      setSaveError(extractErrorMessage(err, "Save failed."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await catalogService.deleteServiceAddon(serviceId, deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, "Delete failed."));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">
        Optional extras a customer can add to this specific item at booking time, e.g. Button
        Replacement or Shoulder Adjustment for a shirt repair.
      </p>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl mb-3 text-xs">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {editingId ? (
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              required
              className={inp}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Button Replacement"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Description</label>
            <textarea
              rows={2}
              className={inp}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Shown to the customer next to the option, e.g. 'Replace up to 4 buttons'"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="number"
                min="0"
                className={inp}
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Display Order</label>
              <input
                type="number"
                min="0"
                className={inp}
                value={form.display_order}
                onChange={(e) => setForm((f) => ({ ...f, display_order: e.target.value }))}
              />
            </div>
          </div>
          {editingId !== "new" && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-4 h-4 rounded accent-teal-700"
                checked={!!form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              />
              <span className="text-xs font-medium text-gray-700">Active (visible to customers)</span>
            </label>
          )}

          {saveError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs">
              {saveError}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="flex-1 py-2 rounded-xl border-2 border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              {saving && <Loader2 size={12} className="animate-spin" />}
              {saving ? "Saving…" : editingId === "new" ? "Create" : "Save Changes"}
            </button>
          </div>
        </form>
      ) : (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="animate-spin text-teal-600" size={22} />
            </div>
          ) : addons.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-6 text-center">
              No add-ons yet for this item.
            </p>
          ) : (
            <div className="space-y-2 mb-4">
              {addons.map((addon) => (
                <div
                  key={addon.id}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 border ${
                    addon.is_active ? "border-gray-100 bg-white" : "border-rose-100 bg-rose-50/40"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${
                        addon.is_active ? "text-gray-800" : "text-gray-400 line-through decoration-1"
                      }`}
                    >
                      {addon.name}
                    </p>
                    {addon.description && (
                      <p className="text-[11px] text-gray-400 truncate">{addon.description}</p>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-0.5 text-xs font-bold text-gray-600 shrink-0 tabular-nums">
                    <IndianRupee size={10} />
                    {Number(addon.price).toLocaleString("en-IN")}
                  </span>
                  {!addon.is_active && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600 shrink-0">
                      Inactive
                    </span>
                  )}
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => openEdit(addon)}
                      title="Edit"
                      className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(addon)}
                      title="Delete"
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={openCreate}
            className="w-full flex items-center justify-center gap-1.5 border-2 border-dashed border-gray-200 rounded-xl py-2.5 text-xs font-semibold text-gray-400 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50/40 transition-colors"
          >
            <Plus size={14} /> Add Add-on
          </button>
        </>
      )}

      {deleteTarget && (
        <ConfirmModal
          open
          icon={Trash2}
          title="Confirm Delete"
          description={`Delete add-on "${deleteTarget.name}"? This cannot be undone.`}
          confirmLabel={deleting ? "Deleting…" : "Delete"}
          cancelLabel="Cancel"
          tone="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
