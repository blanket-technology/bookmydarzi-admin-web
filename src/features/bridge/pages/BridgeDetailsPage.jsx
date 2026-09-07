import { UserPlus, RefreshCw, Search, Users, UserCheck, UserX } from "lucide-react";
import PageHeader from "../../../components/common/PageHeader";
import DataTable from "../../../components/common/DataTable";
import StatusBadge from "../../../components/common/StatusBadge";
import { formatEmployeeId } from "../../../utils/formatters";
import StatCard from "../components/StatCard.jsx";
import useBridgeList from "../hooks/useBridgeList.js";

export default function BridgeDetailsPage() {
  const {
    navigate,
    loading,
    error,
    search,
    filterActive,
    page,
    limit,
    filtered,
    activeCount,
    staff,
    setSearch,
    setFilterActive,
    setPage,
    setLimit,
    fetchStaff,
    toggleActive,
  } = useBridgeList();

  return (
    <>
      <div className="p-3 sm:p-5 w-full min-h-screen bg-gray-100">
        <PageHeader
          title="Bridge Dashboard"
          subtitle={`${filtered.length} field employee${filtered.length !== 1 ? "s" : ""}`}
          actions={
            <>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search name / email / mobile / ID…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-8 pr-4 py-1.5 rounded-full text-gray-800 text-xs outline-none w-44 sm:w-52 bg-white"
                />
              </div>
              <select value={filterActive} onChange={(e) => { setFilterActive(e.target.value); setPage(1); }} className="px-2.5 py-1.5 rounded-lg text-gray-800 text-xs outline-none bg-white font-semibold">
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
              <button onClick={fetchStaff} className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
                <RefreshCw size={13} /> Refresh
              </button>
              <button onClick={() => navigate("/addbridge")} className="flex items-center gap-1.5 bg-white text-teal-800 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-100">
                <UserPlus size={13} /> Add Employee
              </button>
            </>
          }
        />

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <StatCard icon={Users} label="Total Employees" value={staff.length} tone="teal" />
          <StatCard icon={UserCheck} label="Active" value={activeCount} tone="emerald" />
          <StatCard icon={UserX} label="Inactive" value={staff.length - activeCount} tone="gray" />
        </div>

        <DataTable
          columns={[
            { key: "id", label: "Bridge ID" },
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "mobile", label: "Mobile" },
            { key: "joined", label: "Joined" },
            { key: "status", label: "Status", align: "center" },
            { key: "actions", label: "Actions", align: "center" },
          ]}
          rows={filtered.slice((page - 1) * limit, page * limit)}
          rowKey={(s) => s.id}
          loading={loading}
          emptyMessage={search || filterActive ? "No matching employees." : "No bridge employees found."}
          pagination={{ page, total: filtered.length, limit, onPageChange: setPage, onLimitChange: (l) => { setLimit(l); setPage(1); } }}
          renderRow={(s) => (
            <tr
              key={s.id}
              onClick={() => navigate(`/employees/${s.id}`, { state: { staffId: s.id } })}
              className="hover:bg-teal-50/40 transition-colors text-gray-700 cursor-pointer"
            >
              <td className="px-4 py-2.5 font-mono font-semibold text-teal-700 whitespace-nowrap">
                {formatEmployeeId(s.id, s.user_code)}
              </td>
              <td className="px-4 py-2.5 font-semibold">{s.full_name || "-"}</td>
              <td className="px-4 py-2.5 text-gray-500">{s.email || "-"}</td>
              <td className="px-4 py-2.5 text-gray-500 font-mono">{s.mobile || "-"}</td>
              <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">{s.created_at ? new Date(s.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-"}</td>
              <td className="px-4 py-2.5 text-center">
                <StatusBadge status={s.is_active ? "active" : "inactive"} label={s.is_active ? "Active" : "Inactive"} dot />
              </td>
              <td className="px-4 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => toggleActive(s)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${s.is_active ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100" : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}
                >
                  {s.is_active ? "Deactivate" : "Activate"}
                </button>
              </td>
            </tr>
          )}
        />
      </div>
    </>
  );
}
