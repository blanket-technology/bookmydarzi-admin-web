import { useState } from "react";
import { AlertTriangle, Eye, EyeOff, MessageSquareText, RefreshCw, Star, Trash2 } from "lucide-react";
import PageHeader from "../../../components/common/PageHeader.jsx";
import LoadingState from "../../../components/common/LoadingState.jsx";
import { ConfirmModal } from "../../../components/common/EntityWorkspace.jsx";
import HideReviewModal from "../components/HideReviewModal.jsx";
import useReviews from "../hooks/useReviews.js";

function fmtDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-IN", { dateStyle: "medium" });
}

function Stars({ rating }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={13} fill={i < rating ? "currentColor" : "none"} className={i < rating ? "" : "text-gray-300"} />
      ))}
    </span>
  );
}

export default function ReviewsPage() {
  const {
    items,
    total,
    page,
    hiddenFilter,
    loading,
    error,
    totalPages,
    actionLoading,
    actionError,
    setPage,
    setHiddenFilter,
    hide,
    unhide,
    remove,
    fetchReviews,
  } = useReviews();

  const [hideTarget, setHideTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  return (
    <div className="p-3 sm:p-5 w-full min-h-screen bg-gray-100">
      <PageHeader
        title="Reviews"
        subtitle={`${total} review${total !== 1 ? "s" : ""}`}
        actions={
          <>
            <select
              value={hiddenFilter}
              onChange={(e) => setHiddenFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg text-gray-800 text-xs outline-none bg-white font-semibold"
            >
              <option value="">All reviews</option>
              <option value="false">Visible only</option>
              <option value="true">Hidden only</option>
            </select>
            <button
              onClick={fetchReviews}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </>
        }
      />

      {error && (
        <div className="flex items-center gap-2 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl px-4 py-3 mb-4 text-sm">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <MessageSquareText size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-semibold">No reviews found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Customer", "Order", "Rating", "Comment", "Date", "Status", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map((r) => (
                  <tr key={r.id} className={`hover:bg-slate-50 transition-colors ${r.is_hidden ? "bg-rose-50/40" : ""}`}>
                    <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                      {r.customer_name || `User #${r.id}`}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap font-mono text-xs">
                      {r.order_code || `#${r.order_id}`}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap"><Stars rating={r.rating} /></td>
                    <td className="px-4 py-3 text-slate-600 max-w-[280px]">
                      <span className="line-clamp-2">{r.comment || <span className="text-slate-300">No comment</span>}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{fmtDate(r.created_at)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.is_hidden ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-100 rounded-full px-2 py-0.5">
                          <EyeOff size={11} /> Hidden
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-100 rounded-full px-2 py-0.5">
                          <Eye size={11} /> Visible
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {r.is_hidden ? (
                          <button
                            onClick={() => unhide(r.id)}
                            disabled={actionLoading}
                            className="p-1.5 text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg hover:bg-emerald-100 disabled:opacity-50"
                            title="Unhide review"
                          >
                            <Eye size={13} />
                          </button>
                        ) : (
                          <button
                            onClick={() => setHideTarget(r)}
                            disabled={actionLoading}
                            className="p-1.5 text-rose-600 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100 disabled:opacity-50"
                            title="Hide review"
                          >
                            <EyeOff size={13} />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget(r)}
                          disabled={actionLoading}
                          className="p-1.5 text-gray-500 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                          title="Delete permanently"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-slate-50"
            >Prev</button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 border rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-slate-50"
            >Next</button>
          </div>
        </div>
      )}

      {hideTarget && (
        <HideReviewModal
          review={hideTarget}
          onClose={() => setHideTarget(null)}
          onConfirm={async (reason) => {
            await hide(hideTarget.id, reason);
            setHideTarget(null);
          }}
          loading={actionLoading}
          error={actionError}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          open
          icon={Trash2}
          title="Delete review permanently"
          description={`This cannot be undone. "${deleteTarget.comment || ""}" by ${deleteTarget.customer_name || "this customer"} will be permanently removed.`}
          confirmLabel={actionLoading ? "Deleting…" : "Delete"}
          cancelLabel="Cancel"
          tone="danger"
          onConfirm={async () => {
            await remove(deleteTarget.id);
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
