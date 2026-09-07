import { X } from "lucide-react";

// Generic read-only detail modal for entities with no existing detail view
// anywhere in the app (Addresses, Measurement Profiles, Penalties, Wishlist
// items on Users/UserDetailPage.jsx). Renders whatever fact rows the caller
// supplies - no data is invented, only fields already present in the
// existing full-detail API response are ever passed in.
export default function FactDetailModal({ icon: Icon, title, subtitle, badge, facts, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
              <Icon size={15} className="text-teal-600" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-800 truncate">{title}</h3>
              {subtitle && <p className="text-xs text-gray-400 truncate">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {badge}
            <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-3 space-y-0.5">
          {facts.filter((f) => !f.hidden).map((f) => (
            <div key={f.label} className="flex justify-between gap-4 text-sm py-1.5 border-b border-gray-100 last:border-0">
              <span className="text-gray-500 shrink-0">{f.label}</span>
              <span className="font-semibold text-gray-800 text-right break-words">{f.value ?? "-"}</span>
            </div>
          ))}
        </div>

        <button onClick={onClose} className="w-full mt-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold">
          Close
        </button>
      </div>
    </div>
  );
}
