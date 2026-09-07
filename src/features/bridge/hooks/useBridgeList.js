import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBridgeListStore } from "../store/bridgeListStore.js";

export default function useBridgeList() {
  const navigate = useNavigate();
  const staff = useBridgeListStore((s) => s.staff);
  const loading = useBridgeListStore((s) => s.loading);
  const error = useBridgeListStore((s) => s.error);
  const search = useBridgeListStore((s) => s.search);
  const filterActive = useBridgeListStore((s) => s.filterActive);
  const page = useBridgeListStore((s) => s.page);
  const limit = useBridgeListStore((s) => s.limit);
  const setSearch = useBridgeListStore((s) => s.setSearch);
  const setFilterActive = useBridgeListStore((s) => s.setFilterActive);
  const setPage = useBridgeListStore((s) => s.setPage);
  const setLimit = useBridgeListStore((s) => s.setLimit);
  const fetchStaff = useBridgeListStore((s) => s.fetchStaff);
  const toggleActive = useBridgeListStore((s) => s.toggleActive);
  const getFiltered = useBridgeListStore((s) => s.getFiltered);
  const getActiveCount = useBridgeListStore((s) => s.getActiveCount);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const filtered = getFiltered();
  const activeCount = getActiveCount();

  return {
    navigate,
    staff,
    loading,
    error,
    search,
    filterActive,
    page,
    limit,
    filtered,
    activeCount,
    setSearch,
    setFilterActive,
    setPage,
    setLimit,
    fetchStaff,
    toggleActive,
  };
}
