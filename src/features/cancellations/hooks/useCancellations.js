import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PAGE_SIZE } from "../constants/cancellationConstants.js";
import { getTotalPages } from "../utils/cancellationUtils.js";
import { useCancellationStore } from "../store/cancellationStore.js";
import { cancellationsQueryKey } from "../../../services/queryKeys.js";
import { getCancellations } from "../services/cancellationService.js";
import { buildCancellationParams } from "../utils/cancellationUtils.js";
import { extractErrorMessage } from "../../../utils/formatters.js";

// refund_request_needs_approval (notification_policy.py) broadcasts a
// "NOTIFICATION" WS frame to every admin/superadmin the moment a refund
// needs approval - without a listener here, this financial-approval queue
// had no live push AND no polling (queryClient defaults to
// refetchOnWindowFocus/refetchOnMount: false, staleTime 2min), so a new
// refund request could sit invisible until a manual refresh.
const LIVE_CANCELLATION_EVENTS = ["bmd:NOTIFICATION"];

export default function useCancellations() {
  const page = useCancellationStore((s) => s.page);
  const statusFilter = useCancellationStore((s) => s.statusFilter);
  const paymentFilter = useCancellationStore((s) => s.paymentFilter);
  const setPage = useCancellationStore((s) => s.setPage);
  const setStatusFilter = useCancellationStore((s) => s.setStatusFilter);
  const setPaymentFilter = useCancellationStore((s) => s.setPaymentFilter);

  const [selectedId, setSelectedId] = useState(null);
  const [policyOpen, setPolicyOpen] = useState(false);

  const params = buildCancellationParams({ page, pageSize: PAGE_SIZE, statusFilter, paymentFilter });
  const queryKey = cancellationsQueryKey({ page, statusFilter, paymentFilter });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () => getCancellations(params),
    placeholderData: (prev) => prev, // v5: retain last page while refetching (was dead keepPreviousData)
  });

  const queryClient = useQueryClient();
  useEffect(() => {
    const onLiveEvent = () => {
      queryClient.invalidateQueries({ queryKey: ["cancellations"] });
    };
    LIVE_CANCELLATION_EVENTS.forEach((e) => window.addEventListener(e, onLiveEvent));
    return () => LIVE_CANCELLATION_EVENTS.forEach((e) => window.removeEventListener(e, onLiveEvent));
  }, [queryClient]);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const loading = isLoading;
  const errorMessage = isError ? extractErrorMessage(error, "Failed to load cancellations.") : "";

  const totalPages = getTotalPages(total, PAGE_SIZE);

  return {
    items,
    total,
    page,
    statusFilter,
    paymentFilter,
    loading,
    error: errorMessage,
    selectedId,
    policyOpen,
    totalPages,
    setPage,
    setStatusFilter,
    setPaymentFilter,
    setSelectedId,
    setPolicyOpen,
    fetchCancellations: refetch,
  };
}
