import AddTailorPage from "./AddTailorPage.jsx";
import {
  Filter,
  ChevronDown,
  ChevronUp,
  Search,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import PageHeader from "../../../components/common/PageHeader";
import Pagination from "../../../components/common/Pagination";
import { formatTailorId, formatDate } from "../../../utils/formatters";
import { FILTER_GROUPS } from "../constants/tailorConstants.js";
import useTailorList from "../hooks/useTailorList.js";

export default function TailorDetailsPage() {
  const {
    token,
    navigate,
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
    handleFilter,
    handleResetFilters,
  } = useTailorList();

  if (!token) return null;

  return (
    <>
      <div
        className={`p-5 w-full min-h-screen bg-gray-100 transition-all duration-300 ${
          showForm ? "blur-sm pointer-events-none" : ""
        }`}
      >
        <PageHeader
          title="Tailor Dashboard"
          subtitle={`${filteredTailors.length} tailor${filteredTailors.length !== 1 ? "s" : ""}`}
          actions={
            <>
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search name / email / mobile / ID…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-8 pr-4 py-1.5 rounded-full text-gray-800 text-xs outline-none w-44 sm:w-56 bg-white"
                />
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowFilter(!showFilter)}
                  className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
                >
                  <Filter size={13} /> Filters
                  {Boolean(
                    filters.verify.length ||
                    filters.status.length ||
                    filters.role.length,
                  ) && <span className="w-2 h-2 rounded-full bg-orange-400" />}
                </button>
                {showFilter && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border p-4 z-50">
                    {FILTER_GROUPS.map(({ key, label, opts }) => (
                      <div
                        key={key}
                        className="border-b last:border-0 pb-2 mb-2 last:pb-0 last:mb-0"
                      >
                        <div
                          className="flex justify-between cursor-pointer"
                          onClick={() =>
                            setOpenFilter(openFilter === key ? "" : key)
                          }
                        >
                          <span className="text-xs font-semibold text-gray-700">
                            {label}
                          </span>
                          <span className="text-gray-400">
                            {openFilter === key ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </span>
                        </div>
                        {openFilter === key &&
                          opts.map((item) => (
                            <label
                              key={item}
                              className="flex justify-between mt-1.5 cursor-pointer"
                            >
                              <span className="text-xs text-gray-600">
                                {item}
                              </span>
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
                      className="w-full mt-3 bg-rose-500 hover:bg-rose-600 text-white py-1.5 rounded-lg text-xs font-semibold"
                    >
                      Reset Filters
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={fetchTailors}
                className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
              >
                <RefreshCw size={13} /> Refresh
              </button>

              <button
                onClick={() => navigate("/addtailor")}
                className="flex items-center gap-1.5 bg-white text-teal-800 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-100"
              >
                + Add Tailor
              </button>
            </>
          }
        />

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
                      <span
                        className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${w.is_available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
                      >
                        {w.is_available ? "Available" : "Busy"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-brand text-white">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold">
                    Tailor ID
                  </th>
                  <th className="px-4 py-2.5 text-left font-semibold">Name</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Email</th>
                  <th className="px-4 py-2.5 text-left font-semibold">
                    Mobile
                  </th>
                  <th className="px-4 py-2.5 text-left font-semibold">
                    Joined
                  </th>
                  <th className="px-4 py-2.5 text-center font-semibold">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-10 text-teal-600 font-medium animate-pulse text-sm"
                    >
                      Loading…
                    </td>
                  </tr>
                ) : filteredTailors.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-10 text-gray-400 font-medium"
                    >
                      No tailors found{search ? ` for "${search}"` : ""}.
                    </td>
                  </tr>
                ) : (
                  filteredTailors
                    .slice((page - 1) * limit, page * limit)
                    .map((tailor) => (
                      <tr
                        key={tailor.tailor_id}
                        onClick={() =>
                          navigate(`/tailors/${tailor.tailor_id}`, {
                            state: {
                              tailorId: tailor.tailor_id,
                              userId: tailor.user_id,
                              tailor,
                            },
                          })
                        }
                        className="hover:bg-teal-50/40 transition-colors text-gray-700 cursor-pointer"
                      >
                        <td className="px-4 py-3 font-mono font-semibold text-teal-700 whitespace-nowrap">
                          {formatTailorId(
                            tailor.tailor_id,
                            tailor.tailor_code,
                            tailor.city,
                          )}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-800">
                          {tailor.full_name || "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {tailor.email || "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-500 font-mono">
                          {tailor.mobile || "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                          {tailor.created_at
                            ? formatDate(tailor.created_at)
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {/* Row is clickable → opens the tailor detail page, where
                            all actions (activate/deactivate, verify, delete) live.
                            The main table stays a clean, scannable overview. */}
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${tailor.is_approved ? "bg-teal-50 text-teal-700 ring-1 ring-teal-200" : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"}`}
                          >
                            {tailor.is_approved ? (
                              <ShieldCheck size={11} />
                            ) : (
                              <ShieldOff size={11} />
                            )}
                            {tailor.is_approved ? "Verified" : "Not Verified"}
                          </span>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
          {!loading && filteredTailors.length > 0 && (
            <Pagination
              page={page}
              total={filteredTailors.length}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(l) => {
                setLimit(l);
                setPage(1);
              }}
            />
          )}
        </div>
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
