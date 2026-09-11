import AddTailorPage from "./AddTailorPage.jsx";
import {
  AlertCircle,
  Filter,
  ChevronDown,
  ChevronUp,
  Search,
  RefreshCw,
  X,
  Users,
  ShieldCheck,
  UserCheck,
  Wifi,
  Scissors,
} from "lucide-react";
import PageHeader from "../../../components/common/PageHeader";
import DataTable from "../../../components/common/DataTable";
import StatusBadge from "../../../components/common/StatusBadge";
import { formatTailorId, formatDate } from "../../../utils/formatters";
import { FILTER_GROUPS } from "../constants/tailorConstants.js";
import useTailorList from "../hooks/useTailorList.js";

function KpiCard({ icon: Icon, label, value, tone }) {
  const tones = {
    total: "text-teal-600 bg-teal-50 border-teal-100",
    verified: "text-emerald-600 bg-emerald-50 border-emerald-100",
    active: "text-blue-600 bg-blue-50 border-blue-100",
    available: "text-amber-600 bg-amber-50 border-amber-100",
  };
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 ${tones[tone]}`}>
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-lg font-bold text-gray-800 leading-tight [font-variant-numeric:tabular-nums]">{value}</p>
      </div>
    </div>
  );
}

const TAILOR_TABLE_COLUMNS = [
  { key: "id", label: "Tailor ID" },
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "mobile", label: "Mobile" },
  { key: "joined", label: "Joined" },
  { key: "status", label: "Status", align: "center" },
];

export default function TailorDetailsPage() {
  const {
    token,
    navigate,
    loading,
    fetchError,
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
    handleFilter,
    handleResetFilters,
  } = useTailorList();

  if (!token) return null;

  const activeFilterCount = filters.verify.length + filters.status.length + filters.role.length;
  const hasActiveFilters = Boolean(search || activeFilterCount);

  const kpis = filteredTailors.reduce(
    (acc, t) => {
      if (t.is_approved) acc.verified += 1;
      if (t.is_active) acc.active += 1;
      if (t.is_available) acc.available += 1;
      return acc;
    },
    { verified: 0, active: 0, available: 0 },
  );

  const paginated = filteredTailors.slice((page - 1) * limit, page * limit);

  return (
    <>
      <div
        className={`p-3 sm:p-5 w-full min-h-screen bg-gray-100 transition-all duration-300 ${
          showForm ? "blur-sm pointer-events-none" : ""
        }`}
      >
        <PageHeader
          title="Tailor Dashboard"
          subtitle={`${filteredTailors.length} tailor${filteredTailors.length !== 1 ? "s" : ""}`}
          actions={
            <button
              onClick={() => navigate("/addtailor")}
              className="flex items-center gap-1.5 bg-white text-teal-800 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-100"
            >
              + Add Tailor
            </button>
          }
        />

        {/* Toolbar - search, filter popover, refresh - matching the
            standalone-card pattern used on Users/Payments/Catalog instead of
            being crammed into PageHeader's actions slot. */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 mb-4 flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search name / email / mobile / ID…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-8 py-2 rounded-lg text-gray-800 text-sm outline-none border-2 border-gray-200 focus:border-teal-500 bg-gray-50 focus:bg-white transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${
                activeFilterCount > 0
                  ? "bg-teal-50 border-teal-200 text-teal-700"
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              <Filter size={14} /> Filters
              {activeFilterCount > 0 && (
                <span className="bg-teal-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {showFilter && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50">
                {FILTER_GROUPS.map(({ key, label, opts }) => (
                  <div key={key} className="border-b border-gray-100 last:border-0 pb-2 mb-2 last:pb-0 last:mb-0">
                    <div
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => setOpenFilter(openFilter === key ? "" : key)}
                    >
                      <span className="text-xs font-semibold text-gray-700">{label}</span>
                      <span className="text-gray-400">
                        {openFilter === key ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    </div>
                    {openFilter === key &&
                      opts.map((item) => (
                        <label key={item} className="flex justify-between items-center mt-1.5 cursor-pointer">
                          <span className="text-xs text-gray-600">{item}</span>
                          <input
                            type="checkbox"
                            checked={filters[key].includes(item)}
                            onChange={() => handleFilter(key, item)}
                            className="accent-teal-600"
                          />
                        </label>
                      ))}
                  </div>
                ))}
                <button
                  onClick={handleResetFilters}
                  className="w-full mt-1 bg-gray-50 hover:bg-gray-100 text-gray-600 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={() => { setSearch(""); handleResetFilters(); }}
              className="text-xs font-semibold text-gray-400 hover:text-gray-600 px-2"
            >
              Clear filters
            </button>
          )}

          <button
            onClick={fetchTailors}
            className="flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ml-auto"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {!loading && filteredTailors.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <KpiCard icon={Users} label="Total" value={filteredTailors.length} tone="total" />
            <KpiCard icon={ShieldCheck} label="Verified" value={kpis.verified} tone="verified" />
            <KpiCard icon={UserCheck} label="Active" value={kpis.active} tone="active" />
            <KpiCard icon={Wifi} label="Available" value={kpis.available} tone="available" />
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
          <button
            onClick={() => setWorkloadOpen((v) => !v)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-700">
                Tailor Workload Overview
              </span>
              {!workloadLoading && workload.length > 0 && (
                <span className="text-xs text-gray-400 font-normal">
                  ({workload.length} tailors)
                </span>
              )}
            </div>
            {workloadOpen ? (
              <ChevronUp size={16} className="text-gray-500" />
            ) : (
              <ChevronDown size={16} className="text-gray-500" />
            )}
          </button>
          {workloadOpen && (
            <div className="mt-3">
              {workloadLoading ? (
                <p className="text-xs text-gray-400 animate-pulse">
                  Loading workload…
                </p>
              ) : workload.length === 0 ? (
                <p className="text-xs text-gray-400">
                  No workload data available.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {workload.map((w) => (
                    <div
                      key={w.tailor_id}
                      className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">
                          {w.full_name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          <span className="font-medium text-brand">
                            {w.active_orders}
                          </span>{" "}
                          active ·{" "}
                          <span className="font-medium text-yellow-600">
                            {w.pending_orders}
                          </span>{" "}
                          pending
                        </p>
                      </div>
                      <StatusBadge status={w.is_available ? "active" : "inactive"} label={w.is_available ? "Available" : "Busy"} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {fetchError && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-xl mb-3 text-xs font-semibold">
            <AlertCircle size={14} className="text-amber-500 shrink-0" />
            <span className="flex-1">{fetchError}</span>
            <button onClick={fetchTailors} className="underline font-bold">Retry</button>
          </div>
        )}

        <DataTable
          columns={TAILOR_TABLE_COLUMNS}
          rows={paginated}
          rowKey={(t) => t.tailor_id}
          loading={loading}
          emptyIcon={Scissors}
          emptyMessage={`No tailors found${search ? ` for "${search}"` : ""}.`}
          pagination={{ page, total: filteredTailors.length, limit, onPageChange: setPage, onLimitChange: (l) => { setLimit(l); setPage(1); } }}
          renderRow={(tailor) => (
            <tr
              key={tailor.tailor_id}
              onClick={() =>
                navigate(`/tailors/${tailor.tailor_id}`, {
                  state: { tailorId: tailor.tailor_id, userId: tailor.user_id, tailor },
                })
              }
              className="hover:bg-teal-50/40 transition-colors text-gray-700 cursor-pointer"
            >
              <td className="px-4 py-3 font-mono font-semibold text-teal-700 whitespace-nowrap">
                {formatTailorId(tailor.tailor_id, tailor.tailor_code, tailor.city)}
              </td>
              <td className="px-4 py-3 font-semibold text-gray-800">{tailor.full_name || "N/A"}</td>
              <td className="px-4 py-3 text-gray-500">{tailor.email || "N/A"}</td>
              <td className="px-4 py-3 text-gray-500 font-mono">{tailor.mobile || "N/A"}</td>
              <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                {tailor.created_at ? formatDate(tailor.created_at) : "N/A"}
              </td>
              <td className="px-4 py-3">
                {/* Row is clickable -> opens the tailor detail page, where all
                    actions (activate/deactivate, verify, delete) live. The
                    main table stays a clean, scannable overview. */}
                <div className="flex items-center justify-center gap-1.5">
                  <StatusBadge status={tailor.is_approved ? "verified" : "pending"} label={tailor.is_approved ? "Verified" : "Pending"} />
                  <StatusBadge status={tailor.is_active ? "active" : "inactive"} label={tailor.is_active ? "Active" : "Inactive"} />
                </div>
              </td>
            </tr>
          )}
        />
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex justify-center items-center px-4 py-8">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          />
          <div className="relative z-50 w-full max-w-4xl max-h-[90vh] flex flex-col">
            <button
              onClick={() => setShowForm(false)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white text-lg font-bold shadow-lg z-50 flex items-center justify-center"
            >
              ×
            </button>
            <div className="rounded-2xl overflow-hidden">
              <AddTailorPage />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
