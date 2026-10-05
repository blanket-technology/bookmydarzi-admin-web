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
    // Deferred to a microtask so setLoading(true) doesn't run
    // synchronously during the effect's commit phase (the
    // react-hooks/set-state-in-effect rule) - behavior is unaffected.
    queueMicrotask(() => {
      if (cancelled) return;
      setLoading(true);
      getTailorSpecializations(tailorId)
        .then((ids) => {
          if (cancelled) return;
          setSelectedIds(ids);
          setInitialIds(ids);
        })
        .catch((err) => notifyError(extractErrorMessage(err, "Failed to load specializations.")))
        .finally(() => !cancelled && setLoading(false));
    });
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

  // Quick-select: Women/Men/Kids + Designer toggles that bulk-check the
  // matching individual service boxes below, instead of making admin
  // hand-pick 7-8 checkboxes per category. Category match is by name
  // prefix since that's the only stable signal available here (the
  // catalog payload has no separate gender field) - "Mens Clothing"/
  // "Women Clothing"/"Kids Clothing" are the live category names
  // (see canonical_service_ids.py's own comment about the "Mens" vs "Men"
  // naming mismatch). Stitching tier is inferred from the service name
  // ("Normal Stitching" vs "Designer Stitching"), the only place that
  // distinction is exposed in this payload.
  const quickSelectGroups = useMemo(() => {
    const matchers = [
      { key: "men", label: "Men", test: (name) => /^mens?\s+clothing/i.test(name) },
      { key: "women", label: "Women", test: (name) => /^women'?s?\s+clothing/i.test(name) },
      { key: "kids", label: "Kids", test: (name) => /^kids?\s+clothing/i.test(name) },
    ];
    return matchers
      .map((m) => {
        const category = groupedCategories.find((c) => m.test(c.name));
        if (!category) return null;
        const normalIds = category.services
          .filter((s) => /normal stitching/i.test(s.name))
          .map((s) => Number(s.service_id));
        const designerIds = category.services
          .filter((s) => /designer stitching/i.test(s.name))
          .map((s) => Number(s.service_id));
        if (normalIds.length === 0 && designerIds.length === 0) return null;
        return { ...m, normalIds, designerIds };
      })
      .filter(Boolean);
  }, [groupedCategories]);

  const [designerStitching, setDesignerStitching] = useState(false);

  const applyQuickSelect = (group) => {
    const idsForGroup = designerStitching
      ? [...group.normalIds, ...group.designerIds]
      : group.normalIds;
    const isFullyApplied = idsForGroup.every((id) => selectedIds.includes(id));
    setSelectedIds((prev) => {
      if (isFullyApplied) {
        // Toggling off: remove this group's normal+designer ids only.
        const allGroupIds = new Set([...group.normalIds, ...group.designerIds]);
        return prev.filter((id) => !allGroupIds.has(id));
      }
      const next = new Set(prev);
      idsForGroup.forEach((id) => next.add(id));
      return Array.from(next);
    });
  };

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

      {quickSelectGroups.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-gray-100">
          <span className="text-xs font-semibold text-gray-500 mr-1">Quick select:</span>
          {quickSelectGroups.map((group) => {
            const idsForGroup = designerStitching
              ? [...group.normalIds, ...group.designerIds]
              : group.normalIds;
            const active = idsForGroup.length > 0 && idsForGroup.every((id) => selectedIds.includes(id));
            return (
              <button
                key={group.key}
                type="button"
                onClick={() => applyQuickSelect(group)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  active
                    ? "bg-teal-600 text-white border-teal-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-teal-300"
                }`}
              >
                {group.label}
              </button>
            );
          })}
          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 ml-2 cursor-pointer">
            <input
              type="checkbox"
              checked={designerStitching}
              onChange={(e) => setDesignerStitching(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            Designer stitching
          </label>
        </div>
      )}

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
