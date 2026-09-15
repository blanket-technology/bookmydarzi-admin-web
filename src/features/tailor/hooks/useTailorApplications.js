import { useEffect } from "react";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue.js";
import { useTailorApplicationsStore } from "../store/tailorApplicationsStore.js";

export default function useTailorApplications() {
  const applications = useTailorApplicationsStore((s) => s.applications);
  const loading = useTailorApplicationsStore((s) => s.loading);
  const error = useTailorApplicationsStore((s) => s.error);
  const search = useTailorApplicationsStore((s) => s.search);
  const debouncedSearchStored = useTailorApplicationsStore((s) => s.debouncedSearch);
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
  const panWaiverTarget = useTailorApplicationsStore((s) => s.panWaiverTarget);
  const panWaiverReason = useTailorApplicationsStore((s) => s.panWaiverReason);

  const setSearch = useTailorApplicationsStore((s) => s.setSearch);
  const setDebouncedSearch = useTailorApplicationsStore((s) => s.setDebouncedSearch);
  const setStatus = useTailorApplicationsStore((s) => s.setStatus);
  const setPage = useTailorApplicationsStore((s) => s.setPage);
  const setLimit = useTailorApplicationsStore((s) => s.setLimit);
  const setShowFilter = useTailorApplicationsStore((s) => s.setShowFilter);
  const setRejectTarget = useTailorApplicationsStore((s) => s.setRejectTarget);
  const setRejectReason = useTailorApplicationsStore((s) => s.setRejectReason);
  const setDetailApp = useTailorApplicationsStore((s) => s.setDetailApp);
  const setPanWaiverTarget = useTailorApplicationsStore((s) => s.setPanWaiverTarget);
  const setPanWaiverReason = useTailorApplicationsStore((s) => s.setPanWaiverReason);
  const fetchApplications = useTailorApplicationsStore((s) => s.fetchApplications);
  const handleSearch = useTailorApplicationsStore((s) => s.handleSearch);
  const handleApprove = useTailorApplicationsStore((s) => s.handleApprove);
  const handleRejectConfirm = useTailorApplicationsStore((s) => s.handleRejectConfirm);
  const handlePanWaiverConfirm = useTailorApplicationsStore((s) => s.handlePanWaiverConfirm);
  const openDetail = useTailorApplicationsStore((s) => s.openDetail);

  // Debounced auto-search, matching every other list screen's convention
  // (see useUsers.js/userStore.js's debouncedSearch). Previously this only
  // re-fetched on page/limit/status, so typing in the search box did
  // nothing until the user pressed Enter or clicked the separate Search
  // button (handleSearch - still exposed for that click/Enter path, now a
  // harmless no-op re-fetch of whatever's already debounced-in).
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    if (debouncedSearch !== debouncedSearchStored) {
      setDebouncedSearch(debouncedSearch);
    }
  }, [debouncedSearch, debouncedSearchStored, setDebouncedSearch]);

  useEffect(() => {
    fetchApplications();
  }, [page, limit, status, debouncedSearchStored, fetchApplications]);

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
    panWaiverTarget,
    panWaiverReason,
    setSearch,
    setStatus,
    setPage,
    setLimit,
    setShowFilter,
    setRejectTarget,
    setRejectReason,
    setDetailApp,
    setPanWaiverTarget,
    setPanWaiverReason,
    fetchApplications,
    handleSearch,
    handleApprove,
    handleRejectConfirm,
    handlePanWaiverConfirm,
    openDetail,
  };
}
