import {
  ChevronRight, Pencil, Trash2, Plus, RefreshCw, Layers, Scissors, Shirt, GripVertical,
} from "lucide-react";
import { resolveMediaUrl } from "../../../services/api.js";
import { REORDER_PATHS } from "../constants/catalogConstants.js";
import useDragReorder from "../hooks/useDragReorder.js";

export default function ServiceLineGrid({ category, onSelect, onEdit, onDelete, onDeleteService, onAdd, onRestoreLine, onRestoreService, restoringId, showInactive, onToggleShowInactive, onReordered }) {
  const allLines = [...(category.service_lines || [])].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  const allDirects = [...(category.direct_services || [])].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  const inactiveCount = allLines.filter((l) => !l.is_active).length + allDirects.filter((s) => !s.is_active).length;
  const lines = showInactive ? allLines : allLines.filter((l) => l.is_active);
  const directs = showInactive ? allDirects : allDirects.filter((s) => s.is_active);

  const { order: lineOrder, cardProps, handleProps } = useDragReorder(
    lines, (l) => l.id, REORDER_PATHS.serviceLines, onReordered,
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sub-categories in {category.name}</h2>
        <div className="flex items-center gap-3">
          {inactiveCount > 0 && (
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 cursor-pointer select-none">
              <input type="checkbox" checked={showInactive} onChange={(e) => onToggleShowInactive(e.target.checked)} className="rounded" />
              Show deleted ({inactiveCount})
            </label>
          )}
          <button onClick={onAdd} className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
            <Plus size={13} /> New Sub-category
          </button>
        </div>
      </div>

      {lines.length === 0 && directs.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Layers size={32} className="mx-auto mb-3 opacity-40" />
          <p className="font-semibold">No sub-categories yet</p>
          <p className="text-sm mt-1">Add a sub-category like "Shirt", "Trouser", "Blazer"</p>
          <button onClick={onAdd} className="mt-4 inline-flex items-center gap-2 bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-teal-800">
            <Plus size={14} /> Add Sub-category
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {lineOrder.map((line) => {
          const typeCount = line.stitching_types?.length || 0;
          const inactive = !line.is_active;
          return (
            <div key={line.id} {...(inactive ? {} : cardProps(line))} className={`relative bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ${inactive ? "opacity-60" : ""}`}>
              {!inactive && (
                <span {...handleProps(line)} className={`${handleProps(line).className} absolute top-2 right-2 z-10 p-1`}>
                  <GripVertical size={15} />
                </span>
              )}
              <button className="w-full text-left px-4 py-3.5" onClick={() => onSelect(line)} disabled={inactive}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                    {line.image_url
                      ? <img src={resolveMediaUrl(line.image_url)} alt="" className="w-10 h-10 rounded-lg object-cover" onError={(e) => { e.target.style.display="none"; }} />
                      : <Shirt size={18} className="text-teal-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm">{line.name}</p>
                    {line.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{line.description}</p>}
                    <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">
                        <Scissors size={9} /> {typeCount} item{typeCount !== 1 ? "s" : ""}
                      </span>
                      {line.starting_price != null && (
                        <span className="text-[11px] text-gray-500 font-semibold">from ₹{line.starting_price.toLocaleString()}</span>
                      )}
                      {inactive && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600">
                          Deleted
                        </span>
                      )}
                    </div>
                  </div>
                  {!inactive && <ChevronRight size={14} className="text-gray-300 shrink-0 mt-1" />}
                </div>
              </button>
              <div className="flex border-t border-gray-100">
                {inactive ? (
                  <button
                    onClick={() => onRestoreLine(line)}
                    disabled={restoringId === `line-${line.id}`}
                    className="flex-1 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 flex items-center justify-center gap-1 disabled:opacity-60"
                  >
                    <RefreshCw size={11} className={restoringId === `line-${line.id}` ? "animate-spin" : ""} />
                    {restoringId === `line-${line.id}` ? "Restoring…" : "Restore"}
                  </button>
                ) : (
                  <>
                    <button onClick={() => onSelect(line)} className="flex-1 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50 flex items-center justify-center gap-1">
                      <Scissors size={11} /> Manage Items
                    </button>
                    <div className="w-px bg-gray-100" />
                    <button onClick={() => onEdit(line)} className="flex-1 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-1">
                      <Pencil size={11} /> Edit
                    </button>
                    <div className="w-px bg-gray-100" />
                    <button onClick={() => onDelete(line)} className="flex-1 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center justify-center gap-1">
                      <Trash2 size={11} /> Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {directs.map((svc) => {
          const inactive = !svc.is_active;
          return (
            <div key={svc.service_id} className={`bg-white border-2 border-amber-100 rounded-2xl overflow-hidden shadow-sm ${inactive ? "opacity-60" : ""}`}>
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <Scissors size={20} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800">{svc.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                        Direct service · ₹{(svc.base_price || 0).toLocaleString()}
                      </span>
                      {inactive && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600">
                          Deleted
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex border-t border-amber-100">
                {inactive ? (
                  <button
                    onClick={() => onRestoreService(svc)}
                    disabled={restoringId === `svc-${svc.service_id}`}
                    className="flex-1 py-2.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 flex items-center justify-center gap-1 disabled:opacity-60"
                  >
                    <RefreshCw size={12} className={restoringId === `svc-${svc.service_id}` ? "animate-spin" : ""} />
                    {restoringId === `svc-${svc.service_id}` ? "Restoring…" : "Restore"}
                  </button>
                ) : (
                  <>
                    <button onClick={() => onEdit(svc)} className="flex-1 py-2.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-1">
                      <Pencil size={12} /> Edit
                    </button>
                    <div className="w-px bg-amber-100" />
                    <button onClick={() => onDeleteService(svc)} className="flex-1 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center justify-center gap-1">
                      <Trash2 size={12} /> Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        <button onClick={onAdd} className="border-2 border-dashed border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50/40 transition-colors min-h-[110px]">
          <Plus size={20} />
          <span className="text-xs font-semibold">Add Sub-category</span>
        </button>
      </div>
    </div>
  );
}
