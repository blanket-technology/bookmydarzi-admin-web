import { Search, RefreshCw, X } from "lucide-react";
import { ROLE_OPTIONS, STATUS_OPTIONS } from "../constants/userConstants.js";

export default function UserFilters({
  search,
  roleFilter,
  statusFilter,
  onSearchChange,
  onRoleChange,
  onStatusChange,
  onRefresh,
}) {
  const hasActiveFilters = Boolean(search || roleFilter || statusFilter);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 mb-4 flex flex-wrap items-center gap-2.5">
      <div className="relative flex-1 min-w-[220px]">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search name / email / mobile / ID…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-8 py-2 rounded-lg text-gray-800 text-sm outline-none border-2 border-gray-200 focus:border-teal-500 bg-gray-50 focus:bg-white transition-colors"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
            title="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <select
        value={roleFilter}
        onChange={(e) => onRoleChange(e.target.value)}
        className="px-3 py-2 rounded-lg text-gray-700 text-sm outline-none border-2 border-gray-200 focus:border-teal-500 bg-gray-50 focus:bg-white font-semibold transition-colors min-w-[130px]"
      >
        {ROLE_OPTIONS.map((r) => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>

      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        className="px-3 py-2 rounded-lg text-gray-700 text-sm outline-none border-2 border-gray-200 focus:border-teal-500 bg-gray-50 focus:bg-white font-semibold transition-colors min-w-[110px]"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      {hasActiveFilters && (
        <button
          onClick={() => { onSearchChange(""); onRoleChange(""); onStatusChange(""); }}
          className="text-xs font-semibold text-gray-400 hover:text-gray-600 px-2"
        >
          Clear filters
        </button>
      )}

      <button
        onClick={onRefresh}
        className="flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ml-auto"
      >
        <RefreshCw size={14} /> Refresh
      </button>
    </div>
  );
}
