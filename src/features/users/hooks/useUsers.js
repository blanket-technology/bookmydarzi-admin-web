import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue.js";
import { ROLE_OPTIONS } from "../constants/userConstants.js";
import { getActiveRoleLabel, buildUserListParams } from "../utils/userUtils.js";
import { useUserStore } from "../store/userStore.js";
import { usersListQueryKey } from "../../../services/queryKeys.js";
import { getUsers } from "../services/userService.js";
import { extractErrorMessage } from "../../../utils/formatters.js";

export default function useUsers() {
  const page = useUserStore((s) => s.page);
  const limit = useUserStore((s) => s.limit);
  const search = useUserStore((s) => s.search);
  const roleFilter = useUserStore((s) => s.roleFilter);
  const statusFilter = useUserStore((s) => s.statusFilter);
  const setSearch = useUserStore((s) => s.setSearch);
  const setDebouncedSearch = useUserStore((s) => s.setDebouncedSearch);
  const setRoleFilter = useUserStore((s) => s.setRoleFilter);
  const setStatusFilter = useUserStore((s) => s.setStatusFilter);
  const setPage = useUserStore((s) => s.setPage);
  const setLimit = useUserStore((s) => s.setLimit);

  const debouncedSearch = useDebouncedValue(search);
  const storeDebouncedSearch = useUserStore((s) => s.debouncedSearch);

  useEffect(() => {
    if (debouncedSearch !== storeDebouncedSearch) {
      setDebouncedSearch(debouncedSearch);
    }
  }, [debouncedSearch, storeDebouncedSearch, setDebouncedSearch]);

  const params = buildUserListParams({ page, limit, debouncedSearch, roleFilter, statusFilter });
  const queryKey = usersListQueryKey({ page, limit, debouncedSearch, roleFilter, statusFilter });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () => getUsers(params),
    placeholderData: (prev) => prev, // v5: retain last page while refetching (was dead keepPreviousData)
  });

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const loading = isLoading;
  const errorMessage = isError ? extractErrorMessage(error, "Failed to load users.") : "";

  const activeRoleLabel = getActiveRoleLabel(roleFilter, ROLE_OPTIONS);

  // Role breakdown across the current page - a quick at-a-glance strip
  // (mirrors the Paid/Pending/Failed/COD KPI row on the Payments page), not
  // a separate backend call, since users already carries every row's Role.
  const roleCounts = users.reduce(
    (acc, u) => {
      const key = (u.Role || "").toLowerCase();
      if (key === "user") acc.customer += 1;
      else if (key === "tailor") acc.tailor += 1;
      else if (key === "employee") acc.employee += 1;
      else if (key === "admin" || key === "superadmin") acc.admin += 1;
      if (!u.IsActive) acc.inactive += 1;
      return acc;
    },
    { customer: 0, tailor: 0, employee: 0, admin: 0, inactive: 0 },
  );

  const handleRefresh = () => refetch();

  const handleLimitChange = (nextLimit) => {
    setLimit(nextLimit);
  };

  return {
    users,
    total,
    loading,
    error: errorMessage,
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
    fetchUsers: refetch,
  };
}
