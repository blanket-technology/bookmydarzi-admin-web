import { Loader2 } from "lucide-react";
import Pagination from "./Pagination";

/**
 * DataTable - shared table shell (header bar, loading state, empty state,
 * row rendering, pagination) used across every management list (Users,
 * Bridge, Tailors, ...). Standardizes the teal `brand` header, row density,
 * and loading/empty states that were previously hand-rolled per page with
 * drift (different colspans, different empty-state copy, some pages missing
 * pagination entirely).
 *
 * Deliberately thin: it owns layout, not data-fetching or business logic -
 * each page still owns its own search/filter state and passes the already-
 * filtered `rows` in. Row content is fully caller-controlled via `renderRow`
 * so pages keep their own bespoke action buttons/badges.
 *
 * Props:
 *   columns      {Array<{ key, label, align?, className? }>}
 *   rows         {Array}    already paginated/filtered data for this page
 *   renderRow    {(row, index) => ReactNode}  must return a single <tr>
 *   rowKey       {(row) => string|number}     defaults to row.id ?? row.Id
 *   loading      {boolean}
 *   emptyMessage {string}   shown when rows.length === 0 and not loading
 *   emptyIcon    {ComponentType}  optional lucide icon shown above emptyMessage
 *   pagination   {{ page, total, limit, onPageChange, onLimitChange }} - omit to hide
 */
export default function DataTable({
  columns,
  rows,
  renderRow,
  rowKey,
  loading = false,
  emptyMessage = "No records found.",
  emptyIcon: EmptyIcon,
  pagination,
}) {
  const colSpan = columns.length;
  const getKey = rowKey ?? ((row) => row.id ?? row.Id);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-brand text-white">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 font-semibold ${
                    col.align === "center" ? "text-center" : col.align === "right" ? "text-right" : "text-left"
                  } ${col.className ?? ""}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={colSpan} className="text-center py-14">
                  <Loader2 className="animate-spin mx-auto text-brand" size={22} />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="text-center py-14">
                  {EmptyIcon && (
                    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gray-50">
                      <EmptyIcon size={20} className="text-gray-300" />
                    </div>
                  )}
                  <p className="text-sm font-medium text-gray-400">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <SafeRow key={getKey(row) ?? i}>{renderRow(row, i)}</SafeRow>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && pagination && pagination.total > 0 && (
        <Pagination
          page={pagination.page}
          total={pagination.total}
          limit={pagination.limit}
          onPageChange={pagination.onPageChange}
          onLimitChange={pagination.onLimitChange}
        />
      )}
    </div>
  );
}

// renderRow must return exactly one <tr> - this just passes it through
// without adding an extra wrapper element (which would break table layout).
function SafeRow({ children }) {
  return children;
}
