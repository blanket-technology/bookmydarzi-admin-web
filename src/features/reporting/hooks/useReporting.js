import { useEffect } from "react";
import { useReportingStore } from "../store/reportingStore.js";
import { formatCount, formatRupee, getActiveUserPercent } from "../utils/reportingUtils.js";
import { STATUS_COLORS } from "../constants/reportingConstants.js";

export default function useReporting() {
  const data = useReportingStore((s) => s.data);
  const loading = useReportingStore((s) => s.loading);
  const error = useReportingStore((s) => s.error);
  const lastFetched = useReportingStore((s) => s.lastFetched);
  const fetchData = useReportingStore((s) => s.fetchData);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const orders = data?.orders || {};
  const revenue = data?.revenue || {};
  const users = data?.users || {};
  const tailors = data?.tailors || {};
  const byStatus = orders.by_status || {};
  const totalForBar = orders.total || 1;

  return {
    data,
    loading,
    error,
    lastFetched,
    fetchData,
    orders,
    revenue,
    users,
    tailors,
    byStatus,
    totalForBar,
    statusColors: STATUS_COLORS,
    fmt: formatCount,
    fmtRs: formatRupee,
    activeUserPercent: getActiveUserPercent(users),
  };
}
