import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZES = [10, 25, 50, 100];

/**
 * Unified pagination bar used across all management tables.
 *
 * Props:
 *   page          {number}   current 1-based page
 *   total         {number}   total record count
 *   limit         {number}   records per page
 *   onPageChange  {fn}       called with new page number
 *   onLimitChange {fn}       called with new limit number; parent resets page to 1
 */
export default function Pagination({ page, total, limit, onPageChange, onLimitChange }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 flex-wrap gap-3 bg-white rounded-b-xl">
      {/* Row size selector + count */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>Rows:</span>
        <select
          value={limit}
          onChange={(e) => {
            onLimitChange(Number(e.target.value));
            onPageChange(1);
          }}
          className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 font-semibold outline-none focus:border-teal-400 bg-white"
        >
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {total > 0 && (
          <span className="text-gray-400">
            {start}–{end} of {total}
          </span>
        )}
      </div>

      {/* Prev / Page indicator / Next */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Previous page"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-xs font-semibold text-gray-600 min-w-[4.5rem] text-center">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
