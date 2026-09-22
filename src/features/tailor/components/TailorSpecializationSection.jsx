import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Loader2, Save, Scissors } from "lucide-react";
import useCatalog from "../../catalog/hooks/useCatalog";
import { getTailorSpecializations, updateTailorSpecializations } from "../services/tailorService";
import { extractErrorMessage } from "../../../utils/formatters";
import { notifyError, notifySuccess } from "../../../services/dialogService";

/**
 * Structured specialization checklist (ServiceSubCategory ids) - what
 * broadcast routing actually matches orders against, distinct from the
 * legacy free-text `specialization` field shown elsewhere on this page.
 * Read-only oversight elsewhere in the app pairs with bmdadmin's own
 * checklist at application time; this is admin's equivalent edit surface
 * for correcting a miscategorized tailor after the fact (see
 * PUT /admin/tailors/{id}/specializations).
 */
export default function TailorSpecializationSection({ tailorId }) {
  const { categories, loading: catalogLoading } = useCatalog();
  const [selectedIds, setSelectedIds] = useState([]);
  const [initialIds, setInitialIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState(new Set());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getTailorSpecializations(tailorId)
      .then((ids) => {
        if (cancelled) return;
        setSelectedIds(ids);
        setInitialIds(ids);
      })
      .catch((err) => notifyError(extractErrorMessage(err, "Failed to load specializations.")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [tailorId]);

  const groupedCategories = useMemo(() => {
    return (categories || [])
      .filter((c) => c.is_active)
      .map((c) => {
        const fromLines = (c.service_lines || []).flatMap((l) => l.stitching_types || []);
        const services = [...(c.direct_services || []), ...fromLines].filter((s) => s.is_active);
        return { id: c.id, name: c.name, services };
      })
      .filter((c) => c.services.length > 0);
  }, [categories]);

  const toggleCategory = (categoryId) => {
    setExpandedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  const toggleService = (serviceId) => {
    const id = Number(serviceId);
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const dirty = useMemo(() => {
    if (selectedIds.length !== initialIds.length) return true;
    const a = [...selectedIds].sort();
    const b = [...initialIds].sort();
    return a.some((v, i) => v !== b[i]);
  }, [selectedIds, initialIds]);

  const handleSave = async () => {
    if (selectedIds.length === 0) {
      notifyError("Select at least one specialization - an empty checklist would make this tailor eligible for every order category.");
      return;
    }
    setSaving(true);
    try {
      await updateTailorSpecializations(tailorId, selectedIds);
      setInitialIds(selectedIds);
      notifySuccess("Specializations updated.");
    } catch (err) {
      notifyError(extractErrorMessage(err, "Failed to save specializations."));
    } finally {
      setSaving(false);
    }
  };

  if (loading || catalogLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
        <Loader2 size={16} className="animate-spin" />
        Loading specializations...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
      <div className="flex items-center justify-between pb-4 border-b-2 border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center shrink-0 border border-teal-100">
            <Scissors size={20} className="text-teal-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-base leading-tight">Structured Specializations</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              What broadcast routing strictly matches orders against - {selectedIds.length} selected
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 text-white disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          Save
        </button>
      </div>

      {groupedCategories.length === 0 ? (
        <p className="text-sm text-gray-400">No active catalog categories found.</p>
      ) : (
        <div className="space-y-2">
          {groupedCategories.map((category) => {
            const expanded = expandedCategoryIds.has(category.id);
            const count = category.services.filter((s) => selectedIds.includes(Number(s.service_id))).length;
            return (
              <div key={category.id} className="border border-gray-100 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    {category.name}
                    {count > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 text-[10px] font-bold">
                        {count}
                      </span>
                    )}
                  </span>
                  {expanded ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
                </button>
                {expanded && (
                  <div className="px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {category.services.map((service) => {
                      const id = Number(service.service_id);
                      const checked = selectedIds.includes(id);
                      return (
                        <label key={service.service_id} className="flex items-center gap-2 py-1.5 text-sm text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleService(service.service_id)}
                            className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                          />
                          {service.name}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
