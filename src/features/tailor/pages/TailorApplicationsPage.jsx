import { Filter, X, CheckCircle2, XCircle, AlertCircle, AlertTriangle, Loader2, Eye, Search, RefreshCw, FileText, ImageOff } from "lucide-react";
import { resolveMediaUrl } from "../../../services/api";
import PageHeader from "../../../components/common/PageHeader";
import Pagination from "../../../components/common/Pagination";
import StatusBadge from "../../../components/common/StatusBadge";
import useTailorApplications from "../hooks/useTailorApplications.js";
import { APPLICATION_STATUS_COLOR } from "../constants/tailorConstants.js";
import { getStoredUser } from "../../auth/index.js";
import { ROLES, normalizeRole } from "../../../constants/permissions.js";

const STATUS_COLOR = APPLICATION_STATUS_COLOR;

const DetailField = ({ label, value }) =>
  value != null && value !== "" ? (
    <div>
      <p className="text-xs text-gray-500 font-medium mb-0.5">{label}</p>
      <p className="text-sm text-gray-800 font-semibold">{value}</p>
    </div>
  ) : null;

// KYC document thumbnail - opens the original in a new tab. Admin previously
// had no way to see these at all through this screen (they exist on the
// backend response but were never rendered), so approvals were happening
// without visually verifying identity/bank documents.
const DocumentThumb = ({ label, url }) => (
  <div>
    <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
    {url ? (
      <a href={resolveMediaUrl(url)} target="_blank" rel="noopener noreferrer" className="block">
        <img
          src={resolveMediaUrl(url)}
          alt={label}
          className="w-full h-28 object-cover rounded-lg border border-gray-200 hover:border-teal-400 transition-colors"
          onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
        />
        <div style={{ display: "none" }} className="w-full h-28 rounded-lg border border-gray-200 bg-gray-50 items-center justify-center gap-1.5 text-gray-400">
          <FileText size={16} /> <span className="text-xs">View document</span>
        </div>
      </a>
    ) : (
      <div className="w-full h-28 rounded-lg border border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-1 text-gray-300">
        <ImageOff size={16} />
        <span className="text-xs">Not submitted</span>
      </div>
    )}
  </div>
);

const TailorApplicationsPage = () => {
  const {
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
  } = useTailorApplications();

  // Waiving PAN is Superadmin-only server-side (see
  // approve_tailor_application) - hidden here for a plain Admin rather than
  // shown-then-rejected with a 422, since there's nothing they can do about
  // it anyway. A regular Admin can still approve any application that
  // already has a PAN on file via the normal Approve button.
  const isSuperadmin = normalizeRole(getStoredUser()?.Role) === ROLES.SUPERADMIN;

  const openRejectModal = (app) => {
    setRejectTarget(app);
    setRejectReason("");
  };

  const openPanWaiverModal = (app) => {
    setPanWaiverTarget(app);
    setPanWaiverReason("");
  };

  return (
    <>
      {/* Detail Modal */}
      {detailApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-6">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-gray-800">
                  {detailApp.full_name}
                </h3>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-semibold capitalize ${
                    STATUS_COLOR[detailApp.status?.toLowerCase()] ||
                    STATUS_COLOR.pending
                  }`}
                >
                  {detailApp.status}
                </span>
              </div>
              <button
                onClick={() => setDetailApp(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto p-5 flex-1">
              {detailLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="animate-spin text-teal-600" size={28} />
                </div>
              ) : detailApp._error ? (
                <p className="text-red-600 text-sm text-center py-6">
                  {detailApp._error}
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <DetailField
                      label="Application #"
                      value={detailApp.application_number || detailApp.id}
                    />
                    <DetailField label="Full Name" value={detailApp.full_name} />
                    <DetailField label="Email" value={detailApp.email} />
                    <DetailField label="Phone" value={detailApp.phone} />
                    <DetailField label="City" value={detailApp.city} />
                    <DetailField label="State" value={detailApp.state} />
                    <DetailField
                      label="Experience (years)"
                      value={detailApp.experience_years}
                    />
                    <DetailField
                      label="Specialization"
                      value={detailApp.specialization}
                    />
                    <DetailField
                      label="Submitted At"
                      value={
                        detailApp.submitted_at
                          ? new Date(detailApp.submitted_at).toLocaleString()
                          : null
                      }
                    />
                    <DetailField label="Status" value={detailApp.status} />
                  </div>

                  <div className="mt-5">
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">KYC Documents</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <DocumentThumb label="Aadhaar (Front)" url={detailApp.aadhaar_front_url} />
                      <DocumentThumb label="Aadhaar (Back)" url={detailApp.aadhaar_back_url} />
                      <DocumentThumb label="PAN Card" url={detailApp.pan_card_url} />
                      <DocumentThumb label="Profile Photo" url={detailApp.profile_photo_url} />
                    </div>
                    {!detailApp.pan_card_url && detailApp.status?.toLowerCase() === "pending" && (
                      <p className="text-xs text-amber-600 mt-2 flex items-center gap-1.5">
                        <AlertCircle size={12} /> No PAN card on file - approving will require waiving the PAN requirement.
                      </p>
                    )}
                  </div>

                  <div className="mt-5">
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Bank Details</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                      <DetailField label="Account Holder" value={detailApp.account_holder_name} />
                      <DetailField label="Account Number" value={detailApp.bank_account_number} />
                      <DetailField label="IFSC Code" value={detailApp.ifsc_code} />
                      <DetailField label="UPI ID" value={detailApp.upi_id} />
                    </div>
                    <div className="mt-3">
                      <DocumentThumb label="Bank Passbook / Cheque" url={detailApp.bank_passbook_url} />
                    </div>
                  </div>

                  {detailApp.rejection_reason && (
                    <div className="mt-5">
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Rejection Reason</p>
                      <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg p-3 leading-relaxed">
                        {detailApp.rejection_reason}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {!detailLoading && detailApp.status?.toLowerCase() === "pending" && (
              <div className="flex gap-3 p-5 border-t">
                {detailApp.pan_card_url || isSuperadmin ? (
                  <button
                    onClick={() => {
                      const app = detailApp;
                      const overridePan = !app.pan_card_url;
                      setDetailApp(null);
                      if (overridePan) {
                        openPanWaiverModal(app);
                      } else {
                        handleApprove(app.id);
                      }
                    }}
                    disabled={actionLoading === detailApp.id}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white py-2.5 rounded-xl text-sm font-semibold"
                  >
                    <CheckCircle2 size={15} /> {detailApp.pan_card_url ? "Approve" : "Approve (Waive PAN)"}
                  </button>
                ) : (
                  <div className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-400 py-2.5 rounded-xl text-sm font-semibold text-center px-2">
                    No PAN on file - only a Superadmin can waive this
                  </div>
                )}
                <button
                  onClick={() => {
                    const app = detailApp;
                    setDetailApp(null);
                    openRejectModal(app);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-semibold"
                >
                  <XCircle size={15} /> Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-800">
                Reject Application
              </h3>
              <button
                onClick={() => setRejectTarget(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Rejecting{" "}
              <span className="font-semibold text-gray-800">
                {rejectTarget.full_name}
              </span>
              . Please provide a reason:
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason…"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-red-300"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setRejectTarget(null)}
                className="flex-1 py-2 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={rejectLoading}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-60"
              >
                {rejectLoading ? "Rejecting…" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAN Waiver Modal - Superadmin-only, requires a reason (backend now
          rejects override_pan_requirement=true with no reason attached, see
          approve_tailor_application). */}
      {panWaiverTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <AlertTriangle size={17} className="text-amber-500" /> Approve Without PAN
              </h3>
              <button
                onClick={() => setPanWaiverTarget(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Approving{" "}
              <span className="font-semibold text-gray-800">
                {panWaiverTarget.full_name}
              </span>{" "}
              without a PAN card on file. This is logged to the audit trail and stays visible on
              their tailor profile as a payout-risk flag. Please explain why:
            </p>
            <textarea
              rows={3}
              value={panWaiverReason}
              onChange={(e) => setPanWaiverReason(e.target.value)}
              placeholder="Minimum 5 characters, e.g. 'PAN pending, following up separately'"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-amber-300"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setPanWaiverTarget(null)}
                className="flex-1 py-2 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePanWaiverConfirm}
                disabled={actionLoading === panWaiverTarget.id || panWaiverReason.trim().length < 5}
                className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold disabled:opacity-60"
              >
                {actionLoading === panWaiverTarget.id ? "Approving…" : "Confirm Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full min-h-screen bg-gray-100 p-3 sm:p-5">
        <PageHeader
          title="Tailor Applications"
          subtitle={`${total} application${total !== 1 ? "s" : ""}`}
          actions={
            <>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search name / email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-8 pr-4 py-1.5 rounded-full text-gray-800 text-xs outline-none w-44 sm:w-52 bg-white"
                />
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowFilter(!showFilter)}
                  className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
                >
                  <Filter size={13} /> Filter {status && <span className="w-2 h-2 rounded-full bg-orange-400" />}
                </button>
                {showFilter && (
                  <div className="absolute right-0 mt-2 bg-white shadow-lg rounded-xl p-4 w-48 z-50">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Status</p>
                    <select
                      value={status}
                      onChange={(e) => { setStatus(e.target.value); setPage(1); setShowFilter(false); }}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-700 outline-none"
                    >
                      <option value="">All</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <button onClick={() => { setStatus(""); setShowFilter(false); }} className="mt-3 bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg w-full text-xs font-semibold">Reset</button>
                  </div>
                )}
              </div>
              <button onClick={handleSearch} className="flex items-center gap-1.5 bg-white text-teal-800 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-100">
                <RefreshCw size={13} /> Search
              </button>
            </>
          }
        />

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
            <AlertCircle size={16} />
            {error}
            <button
              onClick={fetchApplications}
              className="ml-auto underline font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-brand text-white">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Application #</th>
                <th className="px-4 py-2.5 text-left font-semibold">Name</th>
                <th className="px-4 py-2.5 text-left font-semibold">Email</th>
                <th className="px-4 py-2.5 text-left font-semibold">Phone</th>
                <th className="px-4 py-2.5 text-left font-semibold">City</th>
                <th className="px-4 py-2.5 text-left font-semibold">Exp (yrs)</th>
                <th className="px-4 py-2.5 text-left font-semibold">Status</th>
                <th className="px-4 py-2.5 text-left font-semibold">Submitted</th>
                <th className="px-4 py-2.5 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-10">
                    <Loader2
                      className="animate-spin mx-auto text-teal-600"
                      size={24}
                    />
                  </td>
                </tr>
              ) : applications.length > 0 ? (
                applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 font-mono font-semibold text-teal-700 whitespace-nowrap">
                      {app.application_number || app.id}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-gray-800">{app.full_name}</td>
                    <td className="px-4 py-2.5 text-gray-500">{app.email}</td>
                    <td className="px-4 py-2.5 text-gray-500 font-mono">{app.phone}</td>
                    <td className="px-4 py-2.5 text-gray-500">{app.city || "-"}</td>
                    <td className="px-4 py-2.5 text-center text-gray-600">{app.experience_years ?? "-"}</td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={app.status?.toLowerCase()} label={app.status} />
                    </td>
                    <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">
                      {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openDetail(app)}
                          className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-semibold"
                        >
                          <Eye size={13} /> View
                        </button>
                        {app.status?.toLowerCase() === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(app.id)}
                              disabled={actionLoading === app.id}
                              className="flex items-center gap-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
                            >
                              <CheckCircle2 size={13} />
                              {actionLoading === app.id
                                ? "Approving…"
                                : "Approve"}
                            </button>
                            <button
                              onClick={() => openRejectModal(app)}
                              className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
                            >
                              <XCircle size={13} /> Reject
                            </button>
                          </>
                        )}
                        {app.status?.toLowerCase() !== "pending" && (
                          <span className="text-xs text-gray-400 italic">
                            {app.status}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-gray-500">
                    No applications found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
          {!loading && total > 0 && (
            <Pagination
              page={page}
              total={total}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(l) => { setLimit(l); setPage(1); }}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default TailorApplicationsPage;
