import {
  ChevronRight, Pencil, Trash2, Plus, RefreshCw, FolderOpen, Layers, Scissors, GripVertical,
} from "lucide-react";
import { resolveMediaUrl } from "../../../services/api.js";
import { REORDER_PATHS } from "../constants/catalogConstants.js";
import useDragReorder from "../hooks/useDragReorder.js";

export default function CategoryGrid({ categories, onSelect, onEdit, onDelete, onAdd, showInactive, onToggleShowInactive, onRestore, restoringId, onReordered }) {
  const activeCount = categories.filter((c) => c.is_active).length;
  const inactiveCount = categories.length - activeCount;
  const visible = showInactive ? categories : categories.filter((c) => c.is_active);

  const { order, cardProps, handleProps } = useDragReorder(
    visible, (c) => c.id, REORDER_PATHS.categories, onReordered,
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">All Categories</h2>
        <div className="flex items-center gap-3">
          {inactiveCount > 0 && (
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 cursor-pointer select-none">
              <input type="checkbox" checked={showInactive} onChange={(e) => onToggleShowInactive(e.target.checked)} className="rounded" />
              Show deleted ({inactiveCount})
            </label>
          )}
          <button onClick={onAdd} className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
            <Plus size={13} /> New Category
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {order.map((cat) => {
          const lineCount = cat.service_lines?.length || 0;
          const directCount = cat.direct_services?.length || 0;
          const inactive = !cat.is_active;
          return (
            <div key={cat.id} {...(inactive ? {} : cardProps(cat))} className={`relative bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border-l-4 ${inactive ? "border-l-gray-300 opacity-60" : "border-l-brand"}`}>
              {!inactive && (
                <span {...handleProps(cat)} className={`${handleProps(cat).className} absolute top-2 right-2 z-10 p-1`}>
                  <GripVertical size={15} />
                </span>
              )}
              <button className="w-full text-left px-4 py-3.5" onClick={() => onSelect(cat)} disabled={inactive}>
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                    {cat.image_url
                      ? <img src={resolveMediaUrl(cat.image_url)} alt="" className="w-11 h-11 rounded-lg object-cover" onError={(e) => { e.target.style.display="none"; }} />
                      : <FolderOpen size={20} className="text-teal-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm leading-tight">{cat.name}</p>
                    {cat.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{cat.description}</p>}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {lineCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">
                          <Layers size={9} /> {lineCount} sub-categor{lineCount !== 1 ? "ies" : "y"}
                        </span>
                      )}
                      {directCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          <Scissors size={9} /> {directCount} direct
                        </span>
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
                    onClick={() => onRestore(cat)}
                    disabled={restoringId === `cat-${cat.id}`}
                    className="flex-1 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 flex items-center justify-center gap-1 disabled:opacity-60"
                  >
                    <RefreshCw size={11} className={restoringId === `cat-${cat.id}` ? "animate-spin" : ""} />
                    {restoringId === `cat-${cat.id}` ? "Restoring…" : "Restore"}
                  </button>
                ) : (
                  <>
                    <button onClick={() => onSelect(cat)} className="flex-1 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50 flex items-center justify-center gap-1">
                      <Layers size={11} /> Manage
                    </button>
                    <div className="w-px bg-gray-100" />
                    <button onClick={() => onEdit(cat)} className="flex-1 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-1">
                      <Pencil size={11} /> Edit
                    </button>
                    <div className="w-px bg-gray-100" />
                    <button onClick={() => onDelete(cat)} className="flex-1 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center justify-center gap-1">
                      <Trash2 size={11} /> Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        <button onClick={onAdd} className="border-2 border-dashed border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50/40 transition-colors min-h-[120px]">
          <Plus size={20} />
          <span className="text-xs font-semibold">Add Category</span>
        </button>
      </div>
    </div>
  );
}
