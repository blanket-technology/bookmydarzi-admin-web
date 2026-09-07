import { useState, useEffect, useCallback } from "react";
import { XCircle, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import api from "../../services/api";
import { extractErrorMessage } from "../../utils/formatters";

const STATUS_BADGE = {
  pending:         "bg-amber-100 text-amber-700",
  approved:        "bg-blue-100 text-blue-700",
  refunded:        "bg-emerald-100 text-emerald-700",
  rejected:        "bg-rose-100 text-rose-700",
  contact_support: "bg-purple-100 text-purple-700",
};

const PAYMENT_BADGE = {
  prepaid:  "bg-blue-50 text-blue-600 border border-blue-200",
  postpaid: "bg-gray-100 text-gray-600",
};

function fmt(n) {
  if (n == null) return "-";
  return `₹${Number(n).toFixed(2)}`;
}

function fmtDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function Badge({ status, map }) {
  const cls = map[status] ?? "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {(status ?? "-").replace(/_/g, " ")}
    </span>
  );
}

// Shared cancellation detail/approve/reject drawer. Extracted from
// Cancellations/CancellationsPage.jsx, but changed to fetch its own record
// by ID (GET /admin/cancellations/{id}) instead of requiring the caller to
// already hold the full PascalCase list-row shape - this lets any page that
// only has a cancellation ID (e.g. Users/UserDetailPage.jsx, which gets a
// slimmer snake_case item from /admin/customers/{id}/full-detail) open the
// exact same view.
export default function CancellationDetailModal({ cancellationId, onClose, onRefresh }) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [overrideAmt, setOverrideAmt] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setLoadError("");
    try {
      const res = await api.get(`/admin/cancellations/${cancellationId}`);
      setItem(res.data);
    } catch (e) {
      setLoadError(extractErrorMessage(e, "Failed to load cancellation."));
    } finally { setLoading(false); }
  }, [cancellationId]);

  // Fetch-on-mount/cancellationId-change; setState happens inside load's
  // async handlers, not synchronously in the effect body.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10">
          <Loader2 size={28} className="animate-spin text-teal-600" />
        </div>
      </div>
    );
  }

  if (loadError || !item) {
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm mb-4">
            <AlertCircle size={14} />{loadError || "Cancellation not found."}
          </div>
          <button onClick={onClose} className="w-full py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold">
            Close
          </button>
        </div>
      </div>
    );
  }

  const effectiveRefund = overrideAmt ? parseFloat(overrideAmt) : (item.OverrideRefundAmount ?? item.RefundAmount);

  async function act(action) {
    if (action === "approve" && overrideAmt && parseFloat(overrideAmt) > (item.PaidAmount ?? 0)) {
      setErr(`Override refund cannot exceed the amount paid (${fmt(item.PaidAmount)}).`);
      return;
    }
    setBusy(action);
    setErr("");
    try {
      const payload = action === "approve"
        ? { override_refund_amount: overrideAmt ? parseFloat(overrideAmt) : null, admin_notes: notes || null }
        : { admin_notes: notes || item.AdminNotes };
      await api.post(`/admin/cancellations/${item.Id}/${action}`, payload);
      onRefresh?.();
      onClose();
    } catch (e) {
      setErr(extractErrorMessage(e, "Action failed. Please try again."));
    } finally {
      setBusy(null);
    }
  }

  async function savePatch() {
    setBusy("patch");
    setErr("");
    try {
      await api.patch(`/admin/cancellations/${item.Id}`, {
        override_refund_amount: overrideAmt ? parseFloat(overrideAmt) : null,
        admin_notes: notes || null,
      });
      onRefresh?.();
      onClose();
    } catch (e) {
      setErr(extractErrorMessage(e, "Save failed."));
    } finally {
      setBusy(null);
    }
  }

  const inp = "border rounded-xl px-3 py-2 text-sm w-full focus:outline-none focus:border-teal-500";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 p-5 border-b">
          <XCircle className="text-rose-500" size={20} />
          <h2 className="text-lg font-bold text-slate-800 flex-1">
            Cancellation {item.CancellationCode ?? `#${item.Id}`}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-slate-400">Order</span><p className="font-semibold">{item.OrderCode ?? item.OrderId}</p></div>
            <div><span className="text-slate-400">Customer</span><p className="font-semibold">{item.CustomerName || "-"}</p></div>
            <div><span className="text-slate-400">Phone</span><p className="font-semibold">{item.CustomerPhone || "-"}</p></div>
            <div><span className="text-slate-400">Stage at Cancel</span><p className="font-semibold">{(item.OrderStageAtCancel ?? "").replace(/_/g, " ") || "-"}</p></div>
            <div><span className="text-slate-400">Payment Type</span><p><Badge status={item.PaymentType} map={PAYMENT_BADGE} /></p></div>
            <div><span className="text-slate-400">Status</span><p><Badge status={item.Status} map={STATUS_BADGE} /></p></div>
            <div><span className="text-slate-400">Amount Paid</span><p className="font-semibold">{fmt(item.PaidAmount)}</p></div>
            <div><span className="text-slate-400">Penalty</span><p className="font-semibold text-rose-600">{fmt(item.PenaltyAmount)}</p></div>
            <div><span className="text-slate-400">Original Refund</span><p className="font-semibold">{fmt(item.RefundAmount)}</p></div>
            <div><span className="text-slate-400">Created</span><p className="text-xs">{fmtDate(item.CreatedAt)}</p></div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Override Refund Amount</label>
            <input
              type="number" min={0} max={item.PaidAmount ?? undefined} step={0.01}
              placeholder={String(item.RefundAmount ?? 0)}
              className={inp}
              value={overrideAmt}
              onChange={(e) => setOverrideAmt(e.target.value)}
            />
            {overrideAmt && (
              <p className="text-xs text-teal-600 font-semibold">Effective refund: {fmt(effectiveRefund)}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Admin Notes</label>
            <textarea
              rows={2} placeholder="Internal notes..."
              className={`${inp} resize-none`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {err && <p className="text-rose-600 text-sm">{err}</p>}

          <div className="flex gap-2 pt-2">
            {item.Status === "pending" && (
              <>
                <button
                  onClick={() => act("approve")}
                  disabled={!!busy}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2.5 rounded-xl transition disabled:opacity-60"
                >
                  {busy === "approve" ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                  Approve & Refund
                </button>
                <button
                  onClick={() => act("reject")}
                  disabled={!!busy}
                  className="flex-1 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold py-2.5 rounded-xl transition disabled:opacity-60"
                >
                  {busy === "reject" ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
                  Reject
                </button>
              </>
            )}
            {item.Status !== "pending" && (
              <button
                onClick={savePatch}
                disabled={!!busy}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold py-2.5 rounded-xl transition disabled:opacity-60"
              >
                {busy === "patch" ? "Saving..." : "Save Changes"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
