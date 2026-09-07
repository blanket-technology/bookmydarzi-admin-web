import { Plus, Scissors, Diamond, Shirt, Pencil, Trash2 } from "lucide-react";
import { resolveMediaUrl } from "../../../services/api.js";

function ServiceVariantCard({ item, quality, onEdit, onDelete }) {
  const isNormal = quality === "normal";
  const isDesigner = quality === "designer";

  return (
    <div className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden
      ${isNormal ? "border-teal-300" : isDesigner ? "border-amber-200" : "border-gray-200"}`}>
      <div className="flex items-start gap-3 p-4">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 overflow-hidden
          ${isNormal ? "bg-teal-50" : isDesigner ? "bg-amber-50" : "bg-gray-50"}`}>
          {item.image_url
            ? <img src={resolveMediaUrl(item.image_url)} alt="" className="w-full h-full object-cover" />
            : isDesigner
              ? <Diamond size={24} className="text-amber-400" />
              : <Shirt size={24} className="text-teal-400" />
          }
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 text-[15px] leading-snug">{item.name}</p>
          {item.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{item.description}</p>
          )}
          <p className={`text-base font-bold mt-2
            ${isNormal ? "text-teal-600" : isDesigner ? "text-amber-600" : "text-gray-700"}`}>
            ₹{(item.base_price || 0).toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{item.estimated_delivery_days ?? 7}-day delivery</p>
        </div>

        <div className="flex flex-col gap-1.5 shrink-0">
          <button
            onClick={() => onEdit(item)}
            className="p-2 text-blue-600 bg-white border border-blue-100 rounded-xl hover:bg-blue-50 shadow-sm"
            title="Edit / Add Photo"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onDelete(item)}
            className="p-2 text-rose-500 bg-white border border-rose-100 rounded-xl hover:bg-rose-50 shadow-sm"
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {(item.is_premium || !item.is_active) && (
        <div className={`px-4 py-2 border-t flex items-center gap-3 text-xs
          ${isDesigner ? "border-amber-100 bg-amber-50/40" : "border-gray-100 bg-gray-50"}`}>
          {item.is_premium && (
            <span className="flex items-center gap-1 text-amber-600 font-semibold">
              <Diamond size={10} /> Premium · routes to Premium Hub
            </span>
          )}
          {!item.is_active && (
            <span className="text-gray-400 italic">Inactive - hidden from customers</span>
          )}
        </div>
      )}
    </div>
  );
}

function AddVariantCard({ quality, onClick }) {
  const styles = {
    normal:   { border: "border-teal-200",  iconBg: "bg-teal-50",  text: "text-teal-600",  hoverBg: "hover:bg-teal-50/50",  label: "Normal",   desc: "Everyday finish",  icon: <Shirt size={22} className="text-teal-300" />   },
    designer: { border: "border-amber-200", iconBg: "bg-amber-50", text: "text-amber-600", hoverBg: "hover:bg-amber-50/50", label: "Designer", desc: "Premium finish",    icon: <Diamond size={22} className="text-amber-300" /> },
  };
  const s = styles[quality] || styles.normal;
  return (
    <button
      onClick={onClick}
      className={`w-full border-2 border-dashed ${s.border} rounded-2xl p-4 flex items-center gap-3 ${s.hoverBg} transition-colors`}
    >
      <div className={`w-14 h-14 rounded-xl ${s.iconBg} flex items-center justify-center shrink-0`}>
        <Plus size={20} className={s.text} />
      </div>
      <div className="text-left">
        <p className={`font-bold text-sm ${s.text}`}>Add {s.label} Variant</p>
        <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
      </div>
    </button>
  );
}

export default function ServiceDetailView({ group, line, category, onEditItem, onDeleteItem, onAddSingleItem }) {
  const { baseName, normal, designer, others } = group;
  const allItems = [normal, designer, ...others].filter(Boolean);
  const prices = allItems.map((i) => i.base_price || 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const representativeImage = normal?.image_url || designer?.image_url || others[0]?.image_url;
  const description = line.description || allItems.find((i) => i.description)?.description || "";

  return (
    <div className="max-w-xl mx-auto">
      <div className="relative rounded-2xl overflow-hidden mb-5 shadow-md" style={{ height: "220px" }}>
        {representativeImage ? (
          <img
            src={resolveMediaUrl(representativeImage)} alt={baseName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-teal-100 via-teal-50 to-indigo-100 flex items-center justify-center">
            <Shirt size={72} className="text-teal-200" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        <div className="absolute bottom-4 left-4">
          <span className="inline-flex items-center gap-1.5 bg-black/40 backdrop-blur-sm text-white/90 text-xs font-semibold px-2.5 py-1 rounded-full mb-2">
            <Scissors size={10} /> {category.name}
          </span>
          <p className="text-white font-bold text-2xl sm:text-3xl drop-shadow leading-tight">{baseName}</p>
        </div>

        {minPrice > 0 && (
          <div className="absolute bottom-4 right-4 bg-teal-700 text-white px-3 py-2 rounded-xl text-right shadow-lg">
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-75">Starting</p>
            <p className="text-lg font-bold leading-tight">₹{minPrice.toLocaleString()}</p>
          </div>
        )}

        {!representativeImage && (
          <div className="absolute top-3 right-3 text-xs text-white/60 bg-black/30 px-2 py-1 rounded-full">
            Add photo via Edit ↓
          </div>
        )}
      </div>

      {description && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <p className="font-bold text-gray-800 text-base mb-1.5">About this service</p>
          <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="font-bold text-gray-800 text-base">Stitching type</p>
            <p className="text-xs text-gray-400 mt-0.5">Select finish and quantity</p>
          </div>
          <button
            onClick={() => onAddSingleItem("")}
            className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-xl hover:bg-teal-100 shrink-0"
          >
            <Plus size={12} /> Add Variant
          </button>
        </div>

        <p className="text-xs text-gray-400 mb-4">Edit a variant to upload its photo - it appears here and on the customer app.</p>

        <div className="space-y-3">
          {normal ? (
            <ServiceVariantCard item={normal} quality="normal" onEdit={onEditItem} onDelete={onDeleteItem} />
          ) : (
            <AddVariantCard quality="normal" onClick={() => onAddSingleItem(`Normal ${baseName}`)} />
          )}
          {designer ? (
            <ServiceVariantCard item={designer} quality="designer" onEdit={onEditItem} onDelete={onDeleteItem} />
          ) : (
            <AddVariantCard quality="designer" onClick={() => onAddSingleItem(`Designer ${baseName}`)} />
          )}
          {others.map((o) => (
            <ServiceVariantCard key={o.service_id} item={o} quality="other" onEdit={onEditItem} onDelete={onDeleteItem} />
          ))}
        </div>
      </div>
    </div>
  );
}
