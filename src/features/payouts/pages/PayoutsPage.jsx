import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Clock, RefreshCw, Wallet } from "lucide-react";
import PageHeader from "../../../components/common/PageHeader.jsx";
import Pagination from "../../../components/common/Pagination.jsx";
import { extractErrorMessage } from "../../../utils/formatters.js";
import MarkPaidModal from "../components/MarkPaidModal.jsx";
import CommissionRatesPanel from "../components/CommissionRatesPanel.jsx";
import * as payoutService from "../services/payoutService.js";

const STATUS_BADGE = {
  pending: "bg-amber-50 text-amber-700 border-amber-100",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

function KpiCard({ icon: Icon, label, value, tone }) {
  const tones = {
    pending: "text-amber-600 bg-amber-50 border-amber-100",
    paid: "text-emerald-600 bg-emerald-50 border-emerald-100",
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

export default function PayoutsPage() {
  const [tab, setTab] = useState("payouts");
  const [payouts, setPayouts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markPaidPayout, setMarkPaidPayout] = useState(null);

  const fetchPayouts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await payoutService.getPayouts({
        page, limit, status: statusFilter || undefined,
      });
      setPayouts(res.payouts || []);
      setTotal(res.total || 0);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load payouts."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "payouts") fetchPayouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page, limit, statusFilter]);

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

  const pendingCount = payouts.filter((p) => p.status === "pending").length;
  const paidCount = payouts.filter((p) => p.status === "paid").length;

  return (
    <>
      {markPaidPayout && (
        <MarkPaidModal
          payout={markPaidPayout}
          onClose={() => setMarkPaidPayout(null)}
          onDone={fetchPayouts}
        />
      )}
      <div className="p-3 sm:p-5 w-full min-h-screen bg-gray-100">
        <PageHeader
          title="Tailor Payouts"
          subtitle="Commission rates and per-order payout tracking - superadmin only"
        />

        <div className="flex gap-1 p-1 rounded-xl bg-white border border-gray-100 shadow-sm mb-4 w-fit">
          {[
            { id: "payouts", label: "Payouts" },
            { id: "rates", label: "Commission Rates" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === t.id ? "bg-teal-700 text-white" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "rates" ? (
          <CommissionRatesPanel />
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 mb-4 flex flex-wrap items-center gap-2.5">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 rounded-lg text-gray-700 text-sm outline-none border-2 border-gray-200 focus:border-teal-500 bg-gray-50 focus:bg-white font-semibold transition-colors min-w-[170px]"
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </select>
              <button
                onClick={fetchPayouts}
                className="flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ml-auto"
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
                <AlertCircle size={16} />{error}
                <button onClick={fetchPayouts} className="ml-auto underline font-semibold">Retry</button>
              </div>
            )}

            {!loading && payouts.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-4 max-w-md">
                <KpiCard icon={Clock} label="Pending (this page)" value={pendingCount} tone="pending" />
                <KpiCard icon={CheckCircle2} label="Paid (this page)" value={paidCount} tone="paid" />
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Order</th>
                    <th className="px-4 py-3 text-left font-semibold">Tailor</th>
                    <th className="px-4 py-3 text-right font-semibold">Order Amount</th>
                    <th className="px-4 py-3 text-right font-semibold">Commission</th>
                    <th className="px-4 py-3 text-right font-semibold">Payout Amount</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-10">
                      <Wallet className="animate-pulse mx-auto text-teal-600" size={22} />
                    </td></tr>
                  ) : payouts.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">
                      No payouts yet.
                    </td></tr>
                  ) : payouts.map((p) => (
                    <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.order_code || `#${p.order_id}`}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{p.tailor_name || `#${p.tailor_id}`}</td>
                      <td className="px-4 py-3 text-right text-gray-600 tabular-nums">₹{Number(p.order_amount).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-gray-500 tabular-nums">{Number(p.commission_percent).toFixed(2)}%</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-800 tabular-nums">₹{Number(p.payout_amount).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_BADGE[p.status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                          {p.status}
                        </span>
                        {p.status === "paid" && p.payout_reference && (
                          <p className="text-[11px] text-gray-400 mt-0.5 font-mono">{p.payout_reference}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.status === "pending" ? (
                          <button
                            onClick={() => setMarkPaidPayout(p)}
                            className="text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg"
                          >
                            Mark Paid
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && total > 0 && (
                <Pagination
                  page={page}
                  total={total}
                  limit={limit}
                  onPageChange={setPage}
                  onLimitChange={handleLimitChange}
                />
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
