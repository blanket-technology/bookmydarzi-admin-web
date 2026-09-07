import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { resetFilters, toggleFilter } from "../utils/tailorUtils.js";
import { useTailorListStore } from "../store/tailorListStore.js";

export default function useTailorList() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("access_token");

  const tailors = useTailorListStore((s) => s.tailors);
  const loading = useTailorListStore((s) => s.loading);
  const workload = useTailorListStore((s) => s.workload);
  const workloadLoading = useTailorListStore((s) => s.workloadLoading);
  const workloadOpen = useTailorListStore((s) => s.workloadOpen);
  const search = useTailorListStore((s) => s.search);
  const filters = useTailorListStore((s) => s.filters);
  const page = useTailorListStore((s) => s.page);
  const limit = useTailorListStore((s) => s.limit);
  const showForm = useTailorListStore((s) => s.showForm);
  const showFilter = useTailorListStore((s) => s.showFilter);
  const openFilter = useTailorListStore((s) => s.openFilter);

  const setSearch = useTailorListStore((s) => s.setSearch);
  const setFilters = useTailorListStore((s) => s.setFilters);
  const setPage = useTailorListStore((s) => s.setPage);
  const setLimit = useTailorListStore((s) => s.setLimit);
  const setShowForm = useTailorListStore((s) => s.showForm);
  const setShowFilter = useTailorListStore((s) => s.setShowFilter);
  const setOpenFilter = useTailorListStore((s) => s.setOpenFilter);
  const setWorkloadOpen = useTailorListStore((s) => s.setWorkloadOpen);
  const fetchTailors = useTailorListStore((s) => s.fetchTailors);
  const toggleActive = useTailorListStore((s) => s.toggleActive);
  const toggleVerify = useTailorListStore((s) => s.toggleVerify);
  const removeTailor = useTailorListStore((s) => s.removeTailor);
  const getFilteredTailors = useTailorListStore((s) => s.getFilteredTailors);
  const init = useTailorListStore((s) => s.init);

  useEffect(() => {
    if (!token) navigate("/", { replace: true });
  }, [token, navigate]);

  useEffect(() => {
    if (!token) return undefined;
    return init();
  }, [token, init]);

  const filteredTailors = getFilteredTailors();

  const handleFilter = (type, value) => {
    setFilters(toggleFilter(filters, type, value));
  };

  const handleResetFilters = () => setFilters(resetFilters());

  return {
    token,
    navigate,
    tailors,
    loading,
    workload,
    workloadLoading,
    workloadOpen,
    search,
    filters,
    page,
    limit,
    showForm,
    showFilter,
    openFilter,
    filteredTailors,
    setSearch,
    setPage,
    setLimit,
    setShowForm,
    setShowFilter,
    setOpenFilter,
    setWorkloadOpen,
    fetchTailors,
    toggleActive,
    toggleVerify,
    removeTailor,
    handleFilter,
    handleResetFilters,
  };
}
