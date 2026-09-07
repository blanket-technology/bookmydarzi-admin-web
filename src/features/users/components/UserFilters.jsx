import { Search, RefreshCw } from "lucide-react";
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
  return (
    <>
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search name / email / mobile / ID…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 pr-4 py-1.5 rounded-full text-gray-800 text-xs outline-none w-44 sm:w-56 bg-white"
        />
      </div>
      <select
        value={roleFilter}
        onChange={(e) => onRoleChange(e.target.value)}
        className="px-2.5 py-1.5 rounded-lg text-gray-800 text-xs outline-none bg-white font-semibold min-w-[120px]"
      >
        {ROLE_OPTIONS.map((r) => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>
      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        className="px-2.5 py-1.5 rounded-lg text-gray-800 text-xs outline-none bg-white font-semibold min-w-[100px]"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      <button
        onClick={onRefresh}
        className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
      >
        <RefreshCw size={13} /> Refresh
      </button>
    </>
  );
}
