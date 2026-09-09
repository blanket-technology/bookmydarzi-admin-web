import { AlertCircle, Users, Scissors, Bike, ShieldCheck, UserX } from "lucide-react";
import PageHeader from "../../../components/common/PageHeader.jsx";
import UserFilters from "../components/UserFilters.jsx";
import UserTable from "../components/UserTable.jsx";
import useUsers from "../hooks/useUsers.js";

// Same KpiCard visual language as the Payments page's Paid/Pending/Failed/COD
// strip, so the two busiest management screens in the admin panel read as
// one consistent system rather than two differently-designed pages.
function KpiCard({ icon: Icon, label, value, tone }) {
  const tones = {
    customer: "text-blue-600 bg-blue-50 border-blue-100",
    tailor: "text-indigo-600 bg-indigo-50 border-indigo-100",
    employee: "text-teal-600 bg-teal-50 border-teal-100",
    admin: "text-amber-600 bg-amber-50 border-amber-100",
    inactive: "text-rose-600 bg-rose-50 border-rose-100",
  };
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 ${tones[tone]}`}>
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide truncate">{label}</p>
        <p className="text-lg font-bold text-gray-800 leading-tight [font-variant-numeric:tabular-nums]">{value}</p>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const {
    users,
    total,
    loading,
    error,
    page,
    limit,
    search,
    roleFilter,
    statusFilter,
    activeRoleLabel,
    roleCounts,
    setSearch,
    setRoleFilter,
    setStatusFilter,
    setPage,
    handleRefresh,
    handleLimitChange,
  } = useUsers();

  return (
    <div className="p-3 sm:p-5 w-full min-h-screen bg-gray-100">
      <PageHeader
        title="User Management"
        subtitle={`${total} account${total !== 1 ? "s" : ""}${roleFilter ? ` · ${activeRoleLabel}` : ""}`}
      />

      <UserFilters
        search={search}
        roleFilter={roleFilter}
        statusFilter={statusFilter}
        onSearchChange={setSearch}
        onRoleChange={setRoleFilter}
        onStatusChange={setStatusFilter}
        onRefresh={handleRefresh}
      />

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
          <AlertCircle size={16} /> {error}
          <button onClick={handleRefresh} className="ml-auto underline font-semibold">Retry</button>
        </div>
      )}

      {!loading && users.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          <KpiCard icon={Users} label="Customers" value={roleCounts.customer} tone="customer" />
          <KpiCard icon={Scissors} label="Tailors" value={roleCounts.tailor} tone="tailor" />
          <KpiCard icon={Bike} label="Employees" value={roleCounts.employee} tone="employee" />
          <KpiCard icon={ShieldCheck} label="Admins" value={roleCounts.admin} tone="admin" />
          <KpiCard icon={UserX} label="Inactive" value={roleCounts.inactive} tone="inactive" />
        </div>
      )}

      <UserTable
        users={users}
        loading={loading}
        search={search}
        roleFilter={roleFilter}
        activeRoleLabel={activeRoleLabel}
        page={page}
        total={total}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={handleLimitChange}
      />
    </div>
  );
}
