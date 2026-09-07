import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TICKET_SEARCH_DEBOUNCE_MS } from "../constants/supportConstants.js";
import { useTicketsStore } from "../store/ticketsStore.js";
import { supportTicketsQueryKey } from "../../../services/queryKeys.js";
import { getTickets } from "../services/supportService.js";
import { buildTicketListParams } from "../utils/supportUtils.js";
import { extractErrorMessage } from "../../../utils/formatters.js";

export default function useSupportTickets() {
  const page = useTicketsStore((s) => s.page);
  const limit = useTicketsStore((s) => s.limit);
  const statusFilter = useTicketsStore((s) => s.statusFilter);
  const search = useTicketsStore((s) => s.search);
  const debouncedSearch = useTicketsStore((s) => s.debouncedSearch);
  const setPage = useTicketsStore((s) => s.setPage);
  const setLimit = useTicketsStore((s) => s.setLimit);
  const setStatusFilter = useTicketsStore((s) => s.setStatusFilter);
  const setSearch = useTicketsStore((s) => s.setSearch);
  const setDebouncedSearch = useTicketsStore((s) => s.setDebouncedSearch);
  const updateTicketStatus = useTicketsStore((s) => s.updateTicketStatus);

  const [viewingId, setViewingId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), TICKET_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search, setDebouncedSearch]);

  const params = buildTicketListParams({ page, limit, statusFilter, debouncedSearch });
  const queryKey = supportTicketsQueryKey({ page, limit, statusFilter, debouncedSearch });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () => getTickets(params),
    placeholderData: (prev) => prev, // v5: retain last page while refetching (was dead keepPreviousData)
  });

  const tickets = data?.tickets ?? [];
  const total = data?.total ?? 0;
  const loading = isLoading;
  const errorMessage = isError ? extractErrorMessage(error, "Failed to load tickets.") : "";

  const handleFilterChange = (val) => setStatusFilter(val);

  const handleLimitChange = (l) => setLimit(l);

  return {
    tickets,
    total,
    loading,
    error: errorMessage,
    page,
    limit,
    statusFilter,
    search,
    viewingId,
    setPage,
    setSearch,
    setViewingId,
    handleFilterChange,
    handleLimitChange,
    fetchTickets: refetch,
    updateTicketStatus,
  };
}
