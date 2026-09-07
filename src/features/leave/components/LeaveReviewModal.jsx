import { useState } from "react";
import { AlertCircle, Calendar, X } from "lucide-react";
import StatusBadge from "../../../components/common/StatusBadge.jsx";

function fmtDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-IN", { dateStyle: "medium" });
}

export default function LeaveReviewModal({ request, onClose, onApprove, onReject, loading, error }) {
  const [notes, setNotes] = useState("");
  const isPending = request.Status === "pending";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-100 flex items-center justify-center">
              <Calendar size={15} className="text-teal-600" />
            </div>
            <h3 className="font-bold text-gray-800">Leave Request</h3>
          </div>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
        </div>

        <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Requested by</span>
            <span className="font-semibold text-gray-800">{request.UserName || `User #${request.UserId}`}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Role</span>
            <span className="capitalize font-semibold text-gray-700">{request.Role === "employee" ? "Bridge" : request.Role}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Dates</span>
            <span className="font-semibold text-gray-800">{fmtDate(request.StartDate)} — {fmtDate(request.EndDate)}</span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <span className="text-gray-500">Status</span>
            <StatusBadge status={request.Status} label={request.Status} />
          </div>
          {request.Reason && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-1">Reason</p>
              <p className="text-sm text-gray-700">{request.Reason}</p>
            </div>
          )}
          {request.AdminNotes && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-1">Admin notes</p>
              <p className="text-sm text-gray-700">{request.AdminNotes}</p>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm mb-3">
            <AlertCircle size={14} />{error}
          </div>
        )}

        {isPending ? (
          <>
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-600 block mb-1">Notes (optional for approve, required for reject)</label>
              <textarea
                rows={3}
                maxLength={500}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add a note for the tailor/employee…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onReject(notes)}
                disabled={loading || !notes.trim()}
                className="flex-1 py-2.5 rounded-xl border-2 border-rose-200 text-rose-600 text-sm font-semibold hover:bg-rose-50 disabled:opacity-60"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => onApprove(notes)}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-brand hover:bg-teal-800 text-white text-sm font-semibold disabled:opacity-60"
              >
                {loading ? "Saving…" : "Approve"}
              </button>
            </div>
          </>
        ) : (
          <button onClick={onClose} className="w-full py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold">
            Close
          </button>
        )}
      </div>
    </div>
  );
}
