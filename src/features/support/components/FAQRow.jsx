import { useState } from "react";
import { Pencil, Trash2, HelpCircle, ChevronDown, ChevronRight } from "lucide-react";
import { FAQ_CAT_BADGE } from "../constants/supportConstants.js";

export default function FAQRow({ faq, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => setOpen((o) => !o)} className="flex-1 flex items-center gap-3 text-left">
          <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
            <HelpCircle size={14} className="text-teal-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 leading-snug">{faq.question}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${FAQ_CAT_BADGE[faq.category] || "bg-gray-100 text-gray-600"}`}>{faq.category}</span>
              <span className="text-xs text-gray-400">#{faq.sort_order}</span>
              {!faq.is_active && <span className="text-xs text-rose-500 font-semibold">inactive</span>}
            </div>
          </div>
          <div className="text-gray-400 shrink-0">{open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</div>
        </button>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={() => onEdit(faq)} className="p-1.5 text-blue-600 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100" title="Edit"><Pencil size={13} /></button>
          <button onClick={() => onDelete(faq)} className="p-1.5 text-rose-600 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100" title="Delete"><Trash2 size={13} /></button>
        </div>
      </div>
      {open && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-50">
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{faq.answer}</p>
        </div>
      )}
    </div>
  );
}
