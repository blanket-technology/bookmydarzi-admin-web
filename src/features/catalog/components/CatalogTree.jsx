import { useState } from "react";
import {
  ChevronDown, ChevronRight, Pencil, Trash2, Plus, RefreshCw,
  FolderOpen, Layers, Scissors, GripVertical, IndianRupee, Sparkles, EyeOff, Truck, ListPlus,
} from "lucide-react";
import { resolveMediaUrl } from "../../../services/api.js";
import { REORDER_PATHS } from "../constants/catalogConstants.js";
import useDragReorder from "../hooks/useDragReorder.js";
import { sortByDisplayOrder } from "../utils/catalogUtils.js";

function countInactive(list) {
  return list.reduce((n, x) => n + (x.is_active ? 0 : 1), 0);
}

/**
 * Single-page expandable catalog tree: categories expand inline to reveal
 * service lines, which expand inline to reveal services/tiers - replacing
 * the old CategoryGrid -> ServiceLineGrid -> StitchTypeList -> ServiceDetailView
 * full-screen drill-down. All three levels support drag-to-reorder, inline
 * add/edit/delete, and activate/restore for soft-deleted rows. `showInactive`
 * is threaded to every level so a single toggle hides deleted rows
 * everywhere, not just at the top.
 */
export default function CatalogTree({
  categories,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onRestoreCategory,
  onAddLine,
  onEditLine,
  onDeleteLine,
  onRestoreLine,
  onAddService,
  onEditService,
  onDeleteService,
  onRestoreService,
  onManageAddons,
  restoringId,
  showInactive,
  onToggleShowInactive,
  onReordered,
}) {
  const [openCategories, setOpenCategories] = useState(() => new Set());
  const [openLines, setOpenLines] = useState(() => new Set());

  const toggleCategory = (id) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleLine = (id) => {
    setOpenLines((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const inactiveCategoryCount = countInactive(categories);
  const inactiveLineCount = categories.reduce((n, c) => n + countInactive(c.service_lines || []), 0);
  const inactiveServiceCount = categories.reduce((n, c) => {
    const direct = countInactive(c.direct_services || []);
    const nested = (c.service_lines || []).reduce((m, l) => m + countInactive(l.stitching_types || []), 0);
    return n + direct + nested;
  }, 0);
  const totalInactive = inactiveCategoryCount + inactiveLineCount + inactiveServiceCount;

  const visibleCategories = sortByDisplayOrder(showInactive ? categories : categories.filter((c) => c.is_active));

  const { order, cardProps, handleProps } = useDragReorder(
    visibleCategories, (c) => c.id, REORDER_PATHS.categories, onReordered,
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-bold text-gray-700">Categories</h2>
          <p className="text-xs text-gray-400 mt-0.5">Click a row to expand sub-categories and items</p>
        </div>
        <div className="flex items-center gap-3">
          {totalInactive > 0 && (
            <button
              onClick={() => onToggleShowInactive(!showInactive)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                showInactive
                  ? "bg-rose-50 border-rose-200 text-rose-600"
                  : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              <EyeOff size={13} />
              {showInactive ? `Hide deleted (${totalInactive})` : `Show deleted (${totalInactive})`}
            </button>
          )}
          <button onClick={onAddCategory} className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm shadow-teal-700/20">
            <Plus size={13} /> New Category
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {order.map((cat) => {
          const isOpen = openCategories.has(cat.id);
          const inactive = !cat.is_active;
          const allLines = sortByDisplayOrder(cat.service_lines || []);
          const allDirect = sortByDisplayOrder(cat.direct_services || []);
          const lines = showInactive ? allLines : allLines.filter((l) => l.is_active);
          const directServices = showInactive ? allDirect : allDirect.filter((s) => s.is_active);
          const lineCount = lines.length;
          const directCount = directServices.length;
          const isEmpty = lineCount === 0 && directCount === 0;

          return (
            <div
              key={cat.id}
              className={`bg-white border rounded-2xl overflow-hidden transition-shadow ${
                inactive
                  ? "border-rose-100 bg-rose-50/30"
                  : isOpen
                    ? "border-teal-200 shadow-md shadow-teal-900/5"
                    : "border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200"
              }`}
            >
              <div {...(inactive ? {} : cardProps(cat))} className="flex items-center gap-1 px-3 py-3">
                {!inactive && <span {...handleProps(cat)}><GripVertical size={15} /></span>}
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left py-0.5"
                >
                  <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isOpen ? "bg-teal-100 text-teal-700" : "text-gray-400"}`}>
                    {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  </span>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ring-1 ${inactive ? "bg-gray-100 ring-gray-200" : "bg-teal-50 ring-teal-100"}`}>
                    {cat.image_url
                      ? <img src={resolveMediaUrl(cat.image_url)} alt="" className="w-10 h-10 rounded-xl object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                      : <FolderOpen size={18} className={inactive ? "text-gray-400" : "text-teal-600"} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm leading-tight ${inactive ? "text-gray-400 line-through decoration-1" : "text-gray-800"}`}>{cat.name}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {lineCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">
                          <Layers size={9} /> {lineCount} sub-categor{lineCount !== 1 ? "ies" : "y"}
                        </span>
                      )}
                      {directCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                          <Scissors size={9} /> {directCount} direct
                        </span>
                      )}
                      {isEmpty && !inactive && (
                        <span className="text-[11px] text-gray-400 italic">Empty — add a sub-category to get started</span>
                      )}
                      {inactive && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-600">
                          <Trash2 size={9} /> Deleted
                        </span>
                      )}
                    </div>
                  </div>
                </button>
                <div className="flex items-center gap-0.5 shrink-0">
                  {inactive ? (
                    <button
                      onClick={() => onRestoreCategory(cat)}
                      disabled={restoringId === `cat-${cat.id}`}
                      className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg disabled:opacity-60"
                    >
                      <RefreshCw size={12} className={restoringId === `cat-${cat.id}` ? "animate-spin" : ""} />
                      {restoringId === `cat-${cat.id}` ? "Restoring…" : "Restore"}
                    </button>
                  ) : (
                    <>
                      <IconButton onClick={() => onAddLine(cat)} title="Add sub-category" tone="teal"><Plus size={14} /></IconButton>
                      <IconButton onClick={() => onEditCategory(cat)} title="Edit" tone="blue"><Pencil size={13} /></IconButton>
                      <IconButton onClick={() => onDeleteCategory(cat)} title="Delete" tone="rose"><Trash2 size={13} /></IconButton>
                    </>
                  )}
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-gray-100 bg-gradient-to-b from-gray-50/80 to-transparent px-3 sm:px-4 py-3.5">
                  <ServiceLineList
                    category={cat}
                    lines={lines}
                    openLines={openLines}
                    toggleLine={toggleLine}
                    onEditLine={onEditLine}
                    onDeleteLine={onDeleteLine}
                    onRestoreLine={onRestoreLine}
                    onAddService={onAddService}
                    onEditService={onEditService}
                    onDeleteService={onDeleteService}
                    onRestoreService={onRestoreService}
                    onManageAddons={onManageAddons}
                    restoringId={restoringId}
                    showInactive={showInactive}
                    onReordered={onReordered}
                  />

                  {directServices.length > 0 && (
                    <div className={lineCount > 0 ? "mt-4" : ""}>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Scissors size={10} /> Direct items — no sub-category
                      </p>
                      <ServiceList
                        services={directServices}
                        parent={{ categoryId: cat.id, lineId: null, lineName: null }}
                        onEditService={onEditService}
                        onDeleteService={onDeleteService}
                        onRestoreService={onRestoreService}
                        onManageAddons={onManageAddons}
                        restoringId={restoringId}
                        onReordered={onReordered}
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-3.5 pt-3 border-t border-dashed border-gray-200">
                    <button onClick={() => onAddLine(cat)} className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100/60 bg-teal-50 px-2.5 py-1.5 rounded-lg transition-colors">
                      <Plus size={12} /> Add Sub-category
                    </button>
                    <button onClick={() => onAddService(cat, null)} className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 bg-gray-50 px-2.5 py-1.5 rounded-lg transition-colors">
                      <Plus size={12} /> Add Direct Item
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {order.length === 0 && (
          <div className="text-center py-14 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
            <FolderOpen size={28} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold text-gray-500">No categories yet</p>
            <p className="text-xs mt-1">Create your first category to start building the catalog</p>
          </div>
        )}

        <button onClick={onAddCategory} className="border-2 border-dashed border-gray-200 rounded-2xl p-4 flex items-center justify-center gap-2 text-gray-400 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50/40 transition-colors">
          <Plus size={16} />
          <span className="text-xs font-semibold">Add Category</span>
        </button>
      </div>
    </div>
  );
}

function IconButton({ onClick, title, tone, children }) {
  const tones = {
    teal: "text-teal-600 hover:bg-teal-50",
    blue: "text-blue-600 hover:bg-blue-50",
    rose: "text-rose-600 hover:bg-rose-50",
  };
  return (
    <button onClick={onClick} title={title} className={`p-1.5 rounded-lg transition-colors ${tones[tone]}`}>
      {children}
    </button>
  );
}

function ServiceLineList({
  category, lines, openLines, toggleLine,
  onEditLine, onDeleteLine, onRestoreLine,
  onAddService, onEditService, onDeleteService, onRestoreService, onManageAddons,
  restoringId, showInactive, onReordered,
}) {
  const { order, cardProps, handleProps } = useDragReorder(
    lines, (l) => l.id, REORDER_PATHS.serviceLines, onReordered,
  );

  if (lines.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {order.map((line) => {
        const isOpen = openLines.has(line.id);
        const inactive = !line.is_active;
        const allServices = sortByDisplayOrder(line.stitching_types || []);
        const services = showInactive ? allServices : allServices.filter((s) => s.is_active);
        return (
          <div key={line.id} className={`bg-white border rounded-xl overflow-hidden ${inactive ? "border-rose-100 bg-rose-50/30" : isOpen ? "border-teal-100" : "border-gray-100"}`}>
            <div {...(inactive ? {} : cardProps(line))} className="flex items-center gap-1 pl-2 pr-2.5 py-2.5">
              {!inactive && <span {...handleProps(line)}><GripVertical size={13} /></span>}
              <button onClick={() => toggleLine(line.id)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${isOpen ? "bg-teal-100 text-teal-700" : "text-gray-400"}`}>
                  {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${inactive ? "bg-gray-100" : "bg-teal-50"}`}>
                  <Layers size={13} className={inactive ? "text-gray-400" : "text-teal-600"} />
                </div>
                <span className={`font-semibold text-sm truncate ${inactive ? "text-gray-400 line-through decoration-1" : "text-gray-700"}`}>{line.name}</span>
                <span className="text-[11px] text-gray-400 shrink-0">{services.length} item{services.length !== 1 ? "s" : ""}</span>
                {inactive && <span className="inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600 shrink-0"><Trash2 size={8} /> Deleted</span>}
              </button>
              <div className="flex items-center gap-0.5 shrink-0">
                {inactive ? (
                  <button
                    onClick={() => onRestoreLine(line)}
                    disabled={restoringId === `line-${line.id}`}
                    className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded-lg disabled:opacity-60"
                  >
                    <RefreshCw size={11} className={restoringId === `line-${line.id}` ? "animate-spin" : ""} /> Restore
                  </button>
                ) : (
                  <>
                    <IconButton onClick={() => onAddService(category, line)} title="Add item" tone="teal"><Plus size={13} /></IconButton>
                    <IconButton onClick={() => onEditLine(line, category)} title="Edit" tone="blue"><Pencil size={12} /></IconButton>
                    <IconButton onClick={() => onDeleteLine(line)} title="Delete" tone="rose"><Trash2 size={12} /></IconButton>
                  </>
                )}
              </div>
            </div>

            {isOpen && (
              <div className="border-t border-gray-100 bg-gray-50/70 px-2.5 sm:px-3 py-2.5">
                <ServiceList
                  services={services}
                  parent={{ categoryId: category.id, lineId: line.id, lineName: line.name }}
                  onEditService={onEditService}
                  onDeleteService={onDeleteService}
                  onRestoreService={onRestoreService}
                  onManageAddons={onManageAddons}
                  restoringId={restoringId}
                  onReordered={onReordered}
                />
                <button onClick={() => onAddService(category, line)} className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100/60 bg-teal-50 px-2.5 py-1.5 rounded-lg mt-2 transition-colors">
                  <Plus size={12} /> Add Item
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ServiceList({ services, parent, onEditService, onDeleteService, onRestoreService, onManageAddons, restoringId, onReordered }) {
  const { order, cardProps, handleProps } = useDragReorder(
    services, (s) => s.service_id ?? s.id, REORDER_PATHS.services, onReordered,
  );

  if (services.length === 0) {
    return <p className="text-xs text-gray-400 italic py-1.5">No items yet.</p>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      {order.map((svc) => {
        const id = svc.service_id ?? svc.id;
        const inactive = !svc.is_active;
        return (
          <div
            key={id}
            {...(inactive ? {} : cardProps(svc))}
            className={`flex items-center gap-2.5 rounded-lg pl-1.5 pr-2.5 py-2 border transition-colors ${
              inactive ? "bg-rose-50/40 border-rose-100" : "bg-white border-gray-100 hover:border-gray-200"
            }`}
          >
            {!inactive && <span {...handleProps(svc)}><GripVertical size={12} /></span>}
            <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${svc.is_premium ? "bg-amber-50" : "bg-gray-100"}`}>
              {svc.is_premium ? <Sparkles size={11} className="text-amber-500" /> : <Scissors size={11} className="text-gray-400" />}
            </div>
            <span className={`text-sm font-medium flex-1 min-w-0 truncate ${inactive ? "text-gray-400 line-through decoration-1" : "text-gray-700"}`}>{svc.name}</span>
            {svc.is_premium && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 shrink-0">Premium</span>}
            {svc.estimated_delivery_days != null && (
              <span className="hidden sm:inline-flex items-center gap-0.5 text-[11px] text-gray-400 shrink-0">
                <Truck size={10} /> {svc.estimated_delivery_days}d
              </span>
            )}
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-gray-600 shrink-0 tabular-nums">
              <IndianRupee size={10} />{Number(svc.base_price ?? 0).toLocaleString("en-IN")}
            </span>
            {inactive && <span className="inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600 shrink-0"><Trash2 size={8} /> Deleted</span>}
            <div className="flex items-center gap-0.5 shrink-0">
              {inactive ? (
                <button
                  onClick={() => onRestoreService(svc)}
                  disabled={restoringId === `svc-${id}`}
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded-lg disabled:opacity-60"
                >
                  <RefreshCw size={11} className={restoringId === `svc-${id}` ? "animate-spin" : ""} /> Restore
                </button>
              ) : (
                <>
                  <IconButton onClick={() => onManageAddons(svc)} title="Manage add-ons" tone="teal"><ListPlus size={12} /></IconButton>
                  <IconButton onClick={() => onEditService(svc, parent)} title="Edit" tone="blue"><Pencil size={11} /></IconButton>
                  <IconButton onClick={() => onDeleteService(svc)} title="Delete" tone="rose"><Trash2 size={11} /></IconButton>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
