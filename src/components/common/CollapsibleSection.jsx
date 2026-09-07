import { useState } from "react";
import { ChevronDown } from "lucide-react";

// Collapsed-by-default card section for detail pages with many data
// categories (e.g. Customer Detail's addresses/measurements/payments/cart/
// tickets/chat/cancellations/penalties/wishlist) - keeps the page scannable
// instead of one long forced scroll through everything at once.
export default function CollapsibleSection({
  icon: Icon,
  title,
  count,
  defaultOpen = false,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 p-5 text-left"
      >
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
          {Icon && <Icon size={15} className="text-teal-600" />} {title}
          {count != null && <span className="text-gray-400 font-normal">({count})</span>}
        </h3>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}
