import { AlertCircle } from "lucide-react";
import PageHeader from "../../../components/common/PageHeader.jsx";
import UserFilters from "../components/UserFilters.jsx";
import UserTable from "../components/UserTable.jsx";
import useUsers from "../hooks/useUsers.js";

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
    setSearch,
    setRoleFilter,
    setStatusFilter,
    setPage,
    handleRefresh,
    handleLimitChange,
  } = useUsers();

  return (
    <>
      <div className="p-3 sm:p-5 w-full min-h-screen bg-gray-100">
        <PageHeader
          title="User Management"
          subtitle={`${total} account${total !== 1 ? "s" : ""}${roleFilter ? ` · ${activeRoleLabel}` : ""}`}
          actions={
            <UserFilters
              search={search}
              roleFilter={roleFilter}
              statusFilter={statusFilter}
              onSearchChange={setSearch}
              onRoleChange={setRoleFilter}
              onStatusChange={setStatusFilter}
              onRefresh={handleRefresh}
            />
          }
        />

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl mb-3 text-xs">
            <AlertCircle size={14} /> {error}
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
    </>
  );
}
