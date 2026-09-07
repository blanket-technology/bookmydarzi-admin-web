import { useEffect, useState } from "react";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue.js";
import { SEARCH_DEBOUNCE_MS } from "../constants/paymentConstants.js";
import { isRefundableOrder } from "../utils/paymentUtils.js";
import { usePaymentStore } from "../store/paymentStore.js";
import { getStoredUser } from "../../../store/authStore.jsx";
import { canManagePayments } from "../../../constants/permissions.js";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { notifyError } from "../../../services/dialogService.js";

export default function usePayments() {
  const orders = usePaymentStore((s) => s.orders);
  const total = usePaymentStore((s) => s.total);
  const loading = usePaymentStore((s) => s.loading);
  const error = usePaymentStore((s) => s.error);
  const page = usePaymentStore((s) => s.page);
  const limit = usePaymentStore((s) => s.limit);
  const filterStatus = usePaymentStore((s) => s.filterStatus);
  const search = usePaymentStore((s) => s.search);
  const setPage = usePaymentStore((s) => s.setPage);
  const setLimit = usePaymentStore((s) => s.setLimit);
  const setFilterStatus = usePaymentStore((s) => s.setFilterStatus);
  const setSearch = usePaymentStore((s) => s.setSearch);
  const setDebouncedSearch = usePaymentStore((s) => s.setDebouncedSearch);
  const fetchOrders = usePaymentStore((s) => s.fetchOrders);
  const syncPaymentForOrder = usePaymentStore((s) => s.syncPaymentForOrder);

  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);

  const [refundOrderId, setRefundOrderId] = useState(null);
  const [detailOrderId, setDetailOrderId] = useState(null);
  const [overrideOrderId, setOverrideOrderId] = useState(null);
  const [syncingOrderId, setSyncingOrderId] = useState(null);

  const currentRole = (getStoredUser()?.Role || "").toLowerCase();
  const canManage = canManagePayments(currentRole);

  useEffect(() => {
    setDebouncedSearch(debouncedSearch);
  }, [debouncedSearch, setDebouncedSearch]);

  useEffect(() => {
    fetchOrders();
  }, [page, limit, filterStatus, debouncedSearch, fetchOrders]);

  const syncPayment = async (orderId) => {
    setSyncingOrderId(orderId);
    try {
      await syncPaymentForOrder(orderId);
    } catch (err) {
      notifyError(extractErrorMessage(err, err.message === "No payment found for this order." ? "No payment found for this order." : "Sync failed."));
    } finally {
      setSyncingOrderId(null);
    }
  };

  const handleLimitChange = (nextLimit) => {
    setLimit(nextLimit);
  };

  const handleFilterStatusChange = (value) => {
    setFilterStatus(value);
  };

  const isRefundable = isRefundableOrder;

  return {
    orders,
    total,
    loading,
    error,
    page,
    limit,
    filterStatus,
    search,
    canManage,
    refundOrderId,
    detailOrderId,
    overrideOrderId,
    syncingOrderId,
    setPage,
    setSearch,
    setRefundOrderId,
    setDetailOrderId,
    setOverrideOrderId,
    fetchOrders,
    syncPayment,
    handleLimitChange,
    handleFilterStatusChange,
    isRefundable,
  };
}
