import { Loader2, RefreshCw, Filter, X } from "lucide-react";
import { ACTION_COLOR } from "../constants/settingsConstants.js";
import { formatAuditAction, formatAuditDate, formatAuditRelated } from "../utils/settingsUtils.js";
import useAudit from "../hooks/useAudit.js";
import { SectionCard, Toast } from "./BillingSection.jsx";

export default function AuditSection() {
  const {
    auditItems, auditTotal, auditPage, auditLoading, auditError, totalPages, loadAudit,
    auditFilters, auditActors, auditActions, setAuditFilter, clearAuditFilters, hasFilters,
  } = useAudit();

  return (
    <SectionCard title="Audit Log" subtitle={`${auditTotal} event${auditTotal !== 1 ? "s" : ""}${hasFilters ? " (filtered)" : ""}`}>
      {/* ── Filter bar: who did what, when ─────────────────────────────── */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-4">
        <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
          <Filter size={13} /> Filters
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {/* Performed By - who did the action */}
          <select
            value={auditFilters.performed_by}
            onChange={(e) => setAuditFilter("performed_by", e.target.value)}
            className="px-2.5 py-2 rounded-lg text-xs bg-white border border-gray-200 outline-none focus:ring-1 focus:ring-teal-400 font-medium text-gray-700"
          >
            <option value="">All People</option>
            {auditActors.map((a) => (
              <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
            ))}
          </select>

          {/* Action type - what was done */}
          <select
            value={auditFilters.action}
            onChange={(e) => setAuditFilter("action", e.target.value)}
            className="px-2.5 py-2 rounded-lg text-xs bg-white border border-gray-200 outline-none focus:ring-1 focus:ring-teal-400 font-medium text-gray-700"
          >
            <option value="">All Actions</option>
            {auditActions.map((ac) => (
              <option key={ac} value={ac}>{formatAuditAction(ac)}</option>
            ))}
          </select>

          {/* Date range */}
          <input
            type="date"
            value={auditFilters.date_from}
            onChange={(e) => setAuditFilter("date_from", e.target.value)}
            title="From date"
            className="px-2.5 py-2 rounded-lg text-xs bg-white border border-gray-200 outline-none focus:ring-1 focus:ring-teal-400 text-gray-700 [color-scheme:light]"
          />
          <input
            type="date"
            value={auditFilters.date_to}
            onChange={(e) => setAuditFilter("date_to", e.target.value)}
            title="To date"
            className="px-2.5 py-2 rounded-lg text-xs bg-white border border-gray-200 outline-none focus:ring-1 focus:ring-teal-400 text-gray-700 [color-scheme:light]"
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          {hasFilters ? (
            <button onClick={clearAuditFilters} className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700">
              <X size={12} /> Clear filters
            </button>
          ) : <span />}
          <button onClick={() => loadAudit(auditPage)} className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:underline">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {auditError && <Toast msg={{ type: "error", text: auditError }} />}

      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">#</th>
              <th className="px-4 py-3 text-left font-semibold">Action</th>
              <th className="px-4 py-3 text-left font-semibold">Performed By</th>
              <th className="px-4 py-3 text-left font-semibold">Related</th>
              <th className="px-4 py-3 text-left font-semibold">Date & Time</th>
            </tr>
          </thead>
          <tbody>
            {auditLoading ? (
              <tr><td colSpan={5} className="text-center py-10"><Loader2 className="animate-spin mx-auto text-teal-600" size={22} /></td></tr>
            ) : auditItems.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">No audit events found.</td></tr>
            ) : auditItems.map((log) => {
              const colorClass = ACTION_COLOR[log.action] || "bg-gray-100 text-gray-700";
              return (
                <tr key={log.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 text-xs">{log.id}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${colorClass}`}>
                      {formatAuditAction(log.action)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{log.performed_by_name || (log.performed_by ? `#${log.performed_by}` : "System")}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatAuditRelated(log) || "-"}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatAuditDate(log.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-500">Page {auditPage} of {totalPages} · {auditTotal} events</p>
          <div className="flex gap-2">
            <button disabled={auditPage <= 1} onClick={() => loadAudit(auditPage - 1)} className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">← Prev</button>
            <button disabled={auditPage >= totalPages} onClick={() => loadAudit(auditPage + 1)} className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next →</button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
