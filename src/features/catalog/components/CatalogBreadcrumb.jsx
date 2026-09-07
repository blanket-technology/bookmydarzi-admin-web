import { ChevronRight } from "lucide-react";

export default function CatalogBreadcrumb({ crumbs, onNavigate }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm flex-wrap">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <div key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={13} className="text-gray-300 shrink-0" />}
            {isLast
              ? <span className="font-bold text-gray-800">{crumb.label}</span>
              : <button onClick={() => onNavigate(i)} className="text-teal-600 hover:text-teal-800 font-semibold hover:underline">{crumb.label}</button>
            }
          </div>
        );
      })}
    </nav>
  );
}
