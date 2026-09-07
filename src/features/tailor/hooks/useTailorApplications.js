import { useEffect } from "react";
import { useTailorApplicationsStore } from "../store/tailorApplicationsStore.js";

export default function useTailorApplications() {
  const applications = useTailorApplicationsStore((s) => s.applications);
  const loading = useTailorApplicationsStore((s) => s.loading);
  const error = useTailorApplicationsStore((s) => s.error);
  const search = useTailorApplicationsStore((s) => s.search);
  const status = useTailorApplicationsStore((s) => s.status);
  const page = useTailorApplicationsStore((s) => s.page);
  const limit = useTailorApplicationsStore((s) => s.limit);
  const total = useTailorApplicationsStore((s) => s.total);
  const showFilter = useTailorApplicationsStore((s) => s.showFilter);
  const actionLoading = useTailorApplicationsStore((s) => s.actionLoading);
  const rejectTarget = useTailorApplicationsStore((s) => s.rejectTarget);
  const rejectReason = useTailorApplicationsStore((s) => s.rejectReason);
  const rejectLoading = useTailorApplicationsStore((s) => s.rejectLoading);
  const detailApp = useTailorApplicationsStore((s) => s.detailApp);
  const detailLoading = useTailorApplicationsStore((s) => s.detailLoading);

  const setSearch = useTailorApplicationsStore((s) => s.setSearch);
  const setStatus = useTailorApplicationsStore((s) => s.setStatus);
  const setPage = useTailorApplicationsStore((s) => s.setPage);
  const setLimit = useTailorApplicationsStore((s) => s.setLimit);
  const setShowFilter = useTailorApplicationsStore((s) => s.setShowFilter);
  const setRejectTarget = useTailorApplicationsStore((s) => s.setRejectTarget);
  const setRejectReason = useTailorApplicationsStore((s) => s.setRejectReason);
  const setDetailApp = useTailorApplicationsStore((s) => s.setDetailApp);
  const fetchApplications = useTailorApplicationsStore((s) => s.fetchApplications);
  const handleSearch = useTailorApplicationsStore((s) => s.handleSearch);
  const handleApprove = useTailorApplicationsStore((s) => s.handleApprove);
  const handleRejectConfirm = useTailorApplicationsStore((s) => s.handleRejectConfirm);
  const openDetail = useTailorApplicationsStore((s) => s.openDetail);

  useEffect(() => {
    fetchApplications();
  }, [page, limit, status, fetchApplications]);

  return {
    applications,
    loading,
    error,
    search,
    status,
    page,
    limit,
    total,
    showFilter,
    actionLoading,
    rejectTarget,
    rejectReason,
    rejectLoading,
    detailApp,
    detailLoading,
    setSearch,
    setStatus,
    setPage,
    setLimit,
    setShowFilter,
    setRejectTarget,
    setRejectReason,
    setDetailApp,
    fetchApplications,
    handleSearch,
    handleApprove,
    handleRejectConfirm,
    openDetail,
  };
}
