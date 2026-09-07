import {
  ChevronRight, Plus, Scissors, Diamond, Shirt,
} from "lucide-react";
import { resolveMediaUrl } from "../../../services/api.js";
import { groupByBaseName } from "../utils/catalogUtils.js";

function TypeGroupCard({ group, onAddVariant, onSelect }) {
  const { baseName, normal, designer, others } = group;
  const hasDesigner = !!designer;
  const allItems = [normal, designer, ...others].filter(Boolean);
  const minPrice = allItems.length > 0 ? Math.min(...allItems.map((i) => i.base_price || 0)) : 0;
  const representativeImage = normal?.image_url || designer?.image_url || others[0]?.image_url;

  return (
    <div className={`bg-white rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col ${hasDesigner ? "border-amber-200" : "border-gray-100"}`}>
      <button className="w-full text-left block" onClick={onSelect}>
        {representativeImage ? (
          <div className="relative h-44 bg-gray-100">
            <img
              src={resolveMediaUrl(representativeImage)} alt={baseName}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
            <div className="absolute top-2.5 right-2.5">
              <span className="text-[10px] font-bold text-white/85 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">customer sees ↑</span>
            </div>
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-white font-bold text-base leading-tight drop-shadow">{baseName}</p>
              <p className="text-white/75 text-xs mt-0.5">
                from ₹{minPrice.toLocaleString()} · {allItems.length} option{allItems.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        ) : (
          <div className={`px-4 py-4 flex items-center gap-3 ${hasDesigner ? "bg-amber-50" : "bg-teal-50"}`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${hasDesigner ? "bg-amber-100" : "bg-teal-100"}`}>
              {hasDesigner ? <Diamond size={20} className="text-amber-600" /> : <Shirt size={20} className="text-teal-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800">{baseName}</p>
              <p className={`text-xs font-semibold mt-0.5 ${hasDesigner ? "text-amber-600" : "text-teal-600"}`}>
                from ₹{minPrice.toLocaleString()} · {allItems.length} option{allItems.length !== 1 ? "s" : ""}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">Tap Details to add photo</p>
            </div>
            <ChevronRight size={16} className="text-gray-300 shrink-0" />
          </div>
        )}
      </button>

      <div className="px-4 py-2.5 flex gap-2 flex-wrap border-t border-gray-50 flex-1">
        {normal && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
            Normal · ₹{(normal.base_price || 0).toLocaleString()}
            {!normal.image_url && (
              <span className="text-[9px] font-bold text-rose-500 bg-rose-50 border border-rose-200 px-1.5 py-px rounded-full ml-0.5">no photo</span>
            )}
          </span>
        )}
        {designer && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            Designer · ₹{(designer.base_price || 0).toLocaleString()}
            {!designer.image_url && (
              <span className="text-[9px] font-bold text-rose-500 bg-rose-50 border border-rose-200 px-1.5 py-px rounded-full ml-0.5">no photo</span>
            )}
          </span>
        )}
        {!normal && <span className="text-xs text-rose-400 italic">Missing Normal</span>}
        {!designer && <span className="text-xs text-gray-400 italic">Missing Designer</span>}
        {others.map((o) => (
          <span key={o.service_id} className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-50 text-gray-600 border border-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
            {o.name} · ₹{(o.base_price || 0).toLocaleString()}
            {!o.image_url && (
              <span className="text-[9px] font-bold text-rose-500 bg-rose-50 border border-rose-200 px-1.5 py-px rounded-full ml-0.5">no photo</span>
            )}
          </span>
        ))}
      </div>

      <div className="flex border-t border-gray-100">
        <button onClick={onSelect} className="flex-1 py-2.5 text-xs font-semibold text-teal-700 hover:bg-teal-50 flex items-center justify-center gap-1 transition-colors">
          <ChevronRight size={12} /> Details
        </button>
        {!normal && (
          <>
            <div className="w-px bg-gray-100" />
            <button onClick={() => onAddVariant(`Normal ${baseName}`)} className="flex-1 py-2.5 text-xs font-semibold text-teal-700 hover:bg-teal-50 flex items-center justify-center gap-1 transition-colors">
              <Plus size={12} /> Normal
            </button>
          </>
        )}
        {!designer && (
          <>
            <div className="w-px bg-gray-100" />
            <button onClick={() => onAddVariant(`Designer ${baseName}`)} className="flex-1 py-2.5 text-xs font-semibold text-amber-600 hover:bg-amber-50 flex items-center justify-center gap-1 transition-colors">
              <Plus size={12} /> Designer
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function StitchTypeList({ line, onAddType, onAddSingleItem, onSelectType }) {
  const types = [...(line.stitching_types || [])].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  const groups = groupByBaseName(types, line.name);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Types in {line.name}</h2>
          <p className="text-xs text-gray-400 mt-0.5">Each card = one option the customer taps</p>
        </div>
        <button onClick={onAddType} className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
          <Plus size={13} /> Add Type
        </button>
      </div>

      {groups.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Scissors size={28} className="opacity-40" />
          </div>
          <p className="font-semibold text-gray-600 text-base">No types yet</p>
          <p className="text-sm mt-1.5 max-w-xs mx-auto text-gray-400">
            Add types like <strong className="text-gray-600">Formal {line.name}</strong>, <strong className="text-gray-600">Casual {line.name}</strong> - each becomes a card on the customer app.
          </p>
          <button onClick={onAddType} className="mt-6 inline-flex items-center gap-2 bg-teal-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-800">
            <Plus size={14} /> Add First Type
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {groups.map((g) => (
          <TypeGroupCard
            key={g.baseName}
            group={g}
            onAddVariant={onAddSingleItem}
            onSelect={() => onSelectType(g)}
          />
        ))}

        <button onClick={onAddType} className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50/40 transition-colors min-h-[140px]">
          <Plus size={20} />
          <span className="text-xs font-semibold">Add Type</span>
        </button>
      </div>
    </div>
  );
}
