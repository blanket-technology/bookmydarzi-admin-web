import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue.js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { countActiveFilters } from "../utils/orderUtils.js";
import { isTailorRole, getOrdersList, resolveOrdersEndpoint } from "../services/orderService.js";
import { useOrderListStore } from "../store/orderListStore.js";
import { orderListQueryKey } from "../../../services/queryKeys.js";
import { buildOrdersListParams } from "../utils/orderUtils.js";
import { extractErrorMessage } from "../../../utils/formatters.js";

// adminWsService dispatches every WS frame as window CustomEvent
// `bmd:${event}` (adminWsService.js's _handle). Previously nothing listened
// for these on the orders list - an admin actively working saw a toast
// ("New order received") but the list itself stayed on stale data until they
// clicked the manual Refresh button.
const LIVE_ORDER_EVENTS = ["bmd:NEW_ORDER", "bmd:ORDER_STATUS_UPDATED", "bmd:NOTIFICATION"];

export default function useOrderList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get("status") || "";
  const token = sessionStorage.getItem("access_token");

  const filterStatus = useOrderListStore((s) => s.filterStatus);
  const filterPayment = useOrderListStore((s) => s.filterPayment);
  const filterTailor = useOrderListStore((s) => s.filterTailor);
  const dateFrom = useOrderListStore((s) => s.dateFrom);
  const dateTo = useOrderListStore((s) => s.dateTo);
  const needsManualAssignment = useOrderListStore((s) => s.needsManualAssignment);
  const showFilters = useOrderListStore((s) => s.showFilters);
  const search = useOrderListStore((s) => s.search);
  const page = useOrderListStore((s) => s.page);
  const limit = useOrderListStore((s) => s.limit);
  const tailors = useOrderListStore((s) => s.tailors);
  const cancelTarget = useOrderListStore((s) => s.cancelTarget);
  const cancelling = useOrderListStore((s) => s.cancelling);

  const setFilterStatus = useOrderListStore((s) => s.setFilterStatus);
  const setFilterPayment = useOrderListStore((s) => s.setFilterPayment);
  const setFilterTailor = useOrderListStore((s) => s.setFilterTailor);
  const setDateFrom = useOrderListStore((s) => s.setDateFrom);
  const setDateTo = useOrderListStore((s) => s.setDateTo);
  const setNeedsManualAssignment = useOrderListStore((s) => s.setNeedsManualAssignment);
  const setShowFilters = useOrderListStore((s) => s.setShowFilters);
  const setSearch = useOrderListStore((s) => s.setSearch);
  const setDebouncedSearch = useOrderListStore((s) => s.setDebouncedSearch);
  const setPage = useOrderListStore((s) => s.setPage);
  const setLimit = useOrderListStore((s) => s.setLimit);
  const setCancelTarget = useOrderListStore((s) => s.setCancelTarget);
  const storeConfirmCancel = useOrderListStore((s) => s.confirmCancel);
  const clearAdvancedFilters = useOrderListStore((s) => s.clearAdvancedFilters);
  const fetchTailors = useOrderListStore((s) => s.fetchTailors);

  const debouncedSearch = useDebouncedValue(search, 400);
  const isTailor = isTailorRole();
  const activeFilterCount = countActiveFilters({
    filterPayment,
    filterTailor,
    dateFrom,
    dateTo,
    needsManualAssignment,
  });

  useEffect(() => {
    if (!token) navigate("/", { replace: true });
  }, [token, navigate]);

  useEffect(() => {
    if (initialStatus && !useOrderListStore.getState().filterStatus) {
      setFilterStatus(initialStatus);
    }
  }, [initialStatus, setFilterStatus]);

  useEffect(() => {
    setDebouncedSearch(debouncedSearch);
  }, [debouncedSearch, setDebouncedSearch]);

  useEffect(() => {
    if (token) fetchTailors();
  }, [token, fetchTailors]);

  const params = buildOrdersListParams({
    page,
    limit,
    isTailor,
    filterStatus,
    debouncedSearch,
    filterPayment,
    filterTailor,
    dateFrom,
    dateTo,
    needsManualAssignment,
  });
  const queryKey = orderListQueryKey({
    endpoint: resolveOrdersEndpoint(),
    page,
    limit,
    filterStatus,
    filterPayment,
    filterTailor,
    dateFrom,
    dateTo,
    needsManualAssignment,
    debouncedSearch,
  });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () => getOrdersList({ endpoint: resolveOrdersEndpoint(), params }),
    enabled: Boolean(token),
    placeholderData: (prev) => prev, // v5: retain last page while refetching (was dead keepPreviousData)
  });

  const queryClient = useQueryClient();
  useEffect(() => {
    if (!token) return;
    const onLiveEvent = () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    };
    LIVE_ORDER_EVENTS.forEach((e) => window.addEventListener(e, onLiveEvent));
    return () => LIVE_ORDER_EVENTS.forEach((e) => window.removeEventListener(e, onLiveEvent));
  }, [token, queryClient]);

  const orders = data?.orders ?? [];
  const total = data?.total ?? orders.length;
  const fetching = isLoading;
  const fetchError = isError ? extractErrorMessage(error, "Failed to load orders.") : null;

  useEffect(() => {
    const urlStatus = searchParams.get("status") || "";
    if (urlStatus !== filterStatus) setFilterStatus(urlStatus);
  }, [searchParams, filterStatus, setFilterStatus]);

  const handleFilterStatusChange = (value) => {
    setFilterStatus(value);
    setSearchParams(value ? { status: value } : {});
  };

  // The Zustand orderListStore's own confirmCancel() refetches into its OWN
  // unused `orders` array (a leftover from before this page moved to React
  // Query) - this page renders `orders` from useQuery above, which that
  // refetch never touches, so a just-cancelled order kept showing its old
  // status until something else (WS event, manual Refresh, full remount)
  // happened to invalidate the query. Explicitly invalidate here so the
  // status update is reflected immediately, same as the WS live-event path.
  const confirmCancel = async (reason) => {
    await storeConfirmCancel(reason);
    queryClient.invalidateQueries({ queryKey: ["orders"] });
  };

  return {
    token,
    navigate,
    isTailor,
    orders,
    total,
    fetching,
    fetchError,
    filterStatus,
    filterPayment,
    filterTailor,
    dateFrom,
    dateTo,
    needsManualAssignment,
    showFilters,
    search,
    page,
    limit,
    tailors,
    cancelTarget,
    cancelling,
    activeFilterCount,
    setFilterPayment,
    setFilterTailor,
    setDateFrom,
    setDateTo,
    setNeedsManualAssignment,
    setShowFilters,
    setSearch,
    setPage,
    setLimit,
    setCancelTarget,
    fetchOrders: refetch,
    confirmCancel,
    clearAdvancedFilters,
    handleFilterStatusChange,
  };
}
