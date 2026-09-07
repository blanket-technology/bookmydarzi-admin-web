import { useMemo, useState } from "react";
import { Ruler, Scissors, User, X } from "lucide-react";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { notifyError, notifySuccess } from "../../../services/dialogService.js";
import { updateOrderMeasurement } from "../services/orderActionsService.js";

const FIELD_GROUPS = [
  {
    label: "Torso",
    fields: [
      ["chest", "Chest"],
      ["waist", "Waist"],
      ["hips", "Hips"],
      ["shoulder", "Shoulder"],
    ],
  },
  {
    label: "Length & fit",
    fields: [
      ["neck", "Neck"],
      ["sleeve_length", "Sleeve length"],
      ["inseam", "Inseam"],
      ["height", "Height"],
    ],
  },
];

const ALL_FIELDS = FIELD_GROUPS.flatMap((g) => g.fields);

const MEASUREMENT_BLOCKED_STATUSES = new Set([
  "stitching_started", "in_progress", "final_check", "ready_for_dispatch",
  "out_for_delivery", "delivered", "completed", "cancelled",
]);

function toFormValues(measurement) {
  const values = {};
  for (const [key] of ALL_FIELDS) values[key] = measurement?.[key] ?? "";
  return values;
}

function fmtUpdatedAt(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function MeasurementModal({ order, onClose, onDone }) {
  const existing = order.measurement;
  const initialValues = useMemo(() => toFormValues(existing), [existing]);
  const [profileName, setProfileName] = useState(existing?.profile_name || "");
  const [values, setValues] = useState(initialValues);
  const [saving, setSaving] = useState(false);

  const blocked = MEASUREMENT_BLOCKED_STATUSES.has(order.Status);
  const valuesDirty = ALL_FIELDS.some(([key]) => String(values[key]) !== String(initialValues[key]));
  const dirty = existing?.id ? valuesDirty : valuesDirty || profileName.trim().length > 0;

  const setField = (key, val) => setValues((prev) => ({ ...prev, [key]: val }));

  const submit = async () => {
    if (!existing?.id && !profileName.trim()) {
      notifyError("Enter a profile name to create a new measurement.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        measurement_id: existing?.id ?? null,
        profile_name: existing?.id ? undefined : profileName.trim(),
        gender: existing?.gender ?? undefined,
        is_default: existing?.is_default ?? false,
      };
      for (const [key] of ALL_FIELDS) {
        const raw = values[key];
        payload[key] = raw === "" ? null : Number(raw);
      }
      await updateOrderMeasurement(order.Id, payload);
      notifySuccess(`Measurements updated for ${order.OrderCode || `#${order.Id}`}.`);
      onDone?.();
    } catch (err) {
      notifyError(extractErrorMessage(err, "Couldn't update measurements."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 max-h-[88vh] flex flex-col overflow-hidden">
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0 bg-gradient-to-b from-slate-50 to-white">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
              <Ruler size={17} className="text-teal-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {existing ? "Update measurements" : "Add measurements"}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {order.OrderCode || `Order #${order.Id}`}
                {existing?.profile_name && (
                  <span className="inline-flex items-center gap-1 ml-2 text-slate-400">
                    <User size={11} className="inline -mt-0.5" />
                    {existing.profile_name}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 overflow-y-auto">
          {blocked ? (
            <div className="flex flex-col items-center text-center gap-2.5 py-4 px-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                <Scissors size={18} className="text-slate-400" />
              </div>
              <p className="text-sm font-bold text-slate-700">Stitching already underway</p>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                Measurements can only be changed before cutting/stitching starts. This order has already moved past that point.
              </p>
            </div>
          ) : (
            <>
              {!existing?.id && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Profile name
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400 transition-shadow"
                  />
                </div>
              )}

              {FIELD_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2.5">
                    {group.label}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {group.fields.map(([key, label]) => (
                      <div key={key}>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                          {label}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            inputMode="decimal"
                            value={values[key]}
                            onChange={(e) => setField(key, e.target.value)}
                            placeholder="0"
                            className="w-full text-sm border border-slate-200 rounded-xl pl-3.5 pr-9 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400 transition-shadow"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-300 pointer-events-none">
                            in
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {existing?.updated_at && (
                <p className="text-[11px] text-slate-400">
                  Last updated {fmtUpdatedAt(existing.updated_at)}
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-slate-100 flex-shrink-0 bg-slate-50/60">
          <span className="text-[11px] text-slate-400">
            {!blocked && dirty ? "Unsaved changes" : ""}
          </span>
          <div className="flex items-center gap-2">
            {blocked ? (
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              >
                Close
              </button>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submit}
                  disabled={saving || !dirty}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-teal-700 hover:bg-teal-800 disabled:bg-teal-200 disabled:cursor-not-allowed text-white shadow-sm transition-colors"
                >
                  {saving ? "Saving…" : "Save measurements"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
