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
    setSearch,
    setRoleFilter,
    setStatusFilter,
    setPage,
    handleRefresh,
    handleLimitChange,
    fetchUsers: refetch,
  };
}
