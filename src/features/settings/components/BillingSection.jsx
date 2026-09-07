import {
  AlertCircle, CheckCircle2, X, Loader2, Pencil, ChevronRight, RefreshCw,
} from "lucide-react";
import { INPUT } from "../constants/settingsConstants.js";
import useBilling from "../hooks/useBilling.js";
import { formatCurrency } from "../../../utils/formatters.js";

export function SectionCard({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {(title || subtitle) && (
        <div className="px-5 py-4 border-b border-gray-100">
          {title && <h2 className="text-base font-bold text-gray-800">{title}</h2>}
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export function Toast({ msg, onClose }) {
  if (!msg) return null;
  const ok = msg.type === "success";
  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold mb-4 ${ok ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
      {ok ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> : <AlertCircle size={16} className="text-red-500 shrink-0" />}
      <span className="flex-1">{msg.text}</span>
      {onClose && <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>}
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-600 block mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function BillingSection() {
  const {
    billingData,
    billingLoading,
    billingError,
    billingEditing,
    billingForm,
    billingSaving,
    billingSaveMsg,
    cacheClearing,
    cacheMsg,
    setBillingEditing,
    setBillingForm,
    setBillingSaveMsg,
    saveBilling,
    clearCache,
    setCacheMsg,
  } = useBilling();

  if (billingLoading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-teal-600" size={28} /></div>;
  if (billingError) return <div className="flex items-center gap-2 text-red-600 text-sm"><AlertCircle size={16} />{billingError}</div>;

  return (
    <div className="space-y-5">
      <SectionCard title="Billing Configuration" subtitle="Fee and tax settings applied to every order">
        {!billingEditing ? (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-teal-100 bg-teal-50 p-4">
                <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-1">Platform / Convenience Fee</p>
                <p className="text-3xl font-extrabold text-teal-800 mb-1">{formatCurrency(billingData?.platform_fee)}</p>
                <p className="text-xs text-teal-600">Charged per order, collected upfront as advance payment.</p>
              </div>
              <div className="rounded-xl border border-teal-100 bg-teal-50 p-4">
                <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-1">GST Rate</p>
                <p className="text-3xl font-extrabold text-teal-800 mb-1">{billingData?.gst_percent ?? "-"}%</p>
                <p className="text-xs text-teal-600">Applied on the services subtotal (Goods & Services Tax).</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <div className="flex items-start gap-2 text-xs text-amber-800">
                <AlertCircle size={14} className="shrink-0 mt-0.5 text-amber-500" />
                Changes take effect immediately for all new orders.
              </div>
              <button
                onClick={() => { setBillingEditing(true); setBillingSaveMsg(null); }}
                className="ml-4 shrink-0 flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-xl"
              >
                <Pencil size={13} /> Edit
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={saveBilling} className="space-y-4">
            <Toast msg={billingSaveMsg} onClose={() => setBillingSaveMsg(null)} />
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Platform Fee (₹)" required>
                <input
                  type="number" min="0" step="1" required
                  value={billingForm.platform_fee}
                  onChange={(e) => setBillingForm((p) => ({ ...p, platform_fee: e.target.value }))}
                  className={INPUT}
                  placeholder="99"
                />
                <p className="text-xs text-gray-400 mt-1">Flat fee charged per order (INR)</p>
              </Field>
              <Field label="GST Rate (%)" required>
                <input
                  type="number" min="0" max="100" step="0.5" required
                  value={billingForm.gst_percent}
                  onChange={(e) => setBillingForm((p) => ({ ...p, gst_percent: e.target.value }))}
                  className={INPUT}
                  placeholder="5"
                />
                <p className="text-xs text-gray-400 mt-1">e.g. enter 5 for 5%</p>
              </Field>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => { setBillingEditing(false); setBillingSaveMsg(null); }} className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={billingSaving} className="flex-1 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                {billingSaving && <Loader2 size={15} className="animate-spin" />} Save Changes
              </button>
            </div>
          </form>
        )}
      </SectionCard>

      <SectionCard title="How Billing Works" subtitle="Reference: order billing breakdown">
        <div className="space-y-2 text-sm text-gray-600">
          {[
            ["Services Subtotal", "Sum of all ordered service prices"],
            ["Platform Fee", `${formatCurrency(billingData?.platform_fee)} flat, advance collected at booking`],
            [`GST (${billingData?.gst_percent ?? "-"}%)`, "Applied on the services subtotal"],
            ["Discount", "Applied on the full bill (after fees + GST) when an offer is used"],
            ["Grand Total", "Subtotal + Platform Fee + GST − Discount"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-start gap-2">
              <ChevronRight size={14} className="shrink-0 text-teal-500 mt-0.5" />
              <span><span className="font-semibold text-gray-800">{k}:</span> {v}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Admin Tools" subtitle="Cache and server-side utilities">
        <Toast msg={cacheMsg} onClose={() => setCacheMsg(null)} />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">Clear Homepage Cache</p>
            <p className="text-xs text-gray-500 mt-0.5">Force-refresh the homepage data served to the customer app</p>
          </div>
          <button
            onClick={clearCache}
            disabled={cacheClearing}
            className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
          >
            {cacheClearing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            Clear Cache
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
