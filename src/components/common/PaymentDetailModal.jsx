import { useState, useEffect } from "react";
import {
  Receipt, X, AlertCircle, AlertTriangle, Copy, Check,
  CreditCard, Truck,
} from "lucide-react";
import api from "../../services/api";
import { extractErrorMessage, formatCurrency, formatDateTime } from "../../utils/formatters";
import StatusBadge from "./StatusBadge.jsx";
import LoadingState from "./LoadingState.jsx";

// Shared payment-detail modal, extracted from Payments/PaymentsPage.jsx so
// any page holding an order ID (e.g. Users/UserDetailPage.jsx's Payments
// tab) can drill into the same view instead of duplicating it.

// A value with a one-click copy affordance - reserved for the gateway
// reference IDs support actually pastes into Razorpay/dispute tickets, not
// every field (a Payment Code or Status doesn't need a copy button).
function CopyRow({ label, value }) {
  const [copied, setCopied] = useState(false);
  const has = value != null && String(value).trim() !== "";

  const onCopy = async () => {
    if (!has) return;
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard blocked (insecure context) - silently no-op */
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-xs font-semibold text-gray-500 shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className={`font-mono text-sm text-right break-all ${
            has ? "text-gray-800 font-semibold" : "text-gray-300"
          }`}
        >
          {has ? value : "Not recorded"}
        </span>
        {has && (
          <button
            onClick={onCopy}
            title={`Copy ${label}`}
            className="shrink-0 p-1 rounded-md text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
          >
            {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
          </button>
        )}
      </div>
    </div>
  );
}

function titleCase(v) {
  if (!v) return v;
  return String(v)
    .split(/[\s_]+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

function Fact({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-800">{value ?? "-"}</p>
    </div>
  );
}

export default function PaymentDetailModal({ orderId, orderCode, onClose }) {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/payments/order/${orderId}`);
        setPayment(res.data);
      } catch (err) {
        setError(extractErrorMessage(err, "Could not load payment details."));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orderId]);

  // Backend PaymentResponse field names:
  //   TransactionId  = Razorpay payment_id (pay_xxx) / COD-<code>
  //   GatewayOrderId = Razorpay order_id  (order_xxx)
  //   PaymentType    = booking | balance | cod (Payment.PaymentType column) -
  //                     the actual "is this COD" signal. Falls back to the
  //                     TransactionId prefix only for rows from before this
  //                     field was added to the response.
  const paymentId = payment?.TransactionId ?? payment?.razorpay_payment_id;
  const gatewayOrderId =
    payment?.GatewayOrderId ??
    payment?.razorpay_order_id ??
    payment?.SessionData?.razorpay_order_id;
  const isCod = payment?.PaymentType
    ? payment.PaymentType === "cod"
    : typeof paymentId === "string" && paymentId.startsWith("COD-");
  const status = (payment?.Status || "").toLowerCase();

  // A Razorpay-method payment stuck at "initiated" with no Payment ID means
  // checkout was opened but never completed - the customer abandoned it or
  // it silently failed client-side. Worth flagging distinctly from a normal
  // in-progress payment, since it's the state most likely to need a manual
  // nudge or a retry link resent to the customer.
  const isStalledCheckout = !isCod && status === "initiated" && !paymentId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header - order context up front so the modal is self-contained,
            not dependent on remembering which table row you clicked. */}
        <div className="bg-[#025e5e] px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Receipt size={17} className="text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white text-sm leading-tight">Payment Details</h3>
              <p className="text-teal-100 text-xs mt-0.5 truncate font-mono">
                {orderCode || `Order #${orderId}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="shrink-0 p-1 rounded-lg hover:bg-white/10">
            <X size={18} className="text-teal-100 hover:text-white" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5">
          {loading ? (
            <LoadingState compact />
          ) : error ? (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-xl text-sm">
              <AlertCircle size={15} className="shrink-0" />{error}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Amount + status - the two things an ops person looks for first */}
              <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Amount</p>
                  <p className="text-2xl font-bold text-gray-800 [font-variant-numeric:tabular-nums]">
                    {payment?.Amount != null ? formatCurrency(payment.Amount, 2) : "-"}
                  </p>
                </div>
                <StatusBadge status={status} label={titleCase(payment?.Status) || "-"} />
              </div>

              {isStalledCheckout && (
                <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-3">
                  <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <span className="font-bold">Checkout was never completed.</span> The customer opened
                    Razorpay checkout but no payment ID came back - they likely abandoned it or it failed
                    silently. Consider resending a payment link.
                  </p>
                </div>
              )}

              {/* Summary facts - Method (the real gateway/collection value,
                  e.g. "Cod"/"Razorpay") and Type (booking vs. balance vs.
                  cod - a different concept) are kept as separate facts, not
                  merged into one "Method" field that used to silently
                  overwrite the real Method value with "Pay on Delivery"
                  whenever isCod was true. */}
              <div className="grid grid-cols-2 gap-4">
                <Fact
                  label="Method"
                  value={
                    <span className="flex items-center gap-1.5">
                      {isCod ? <Truck size={14} className="text-orange-500" /> : <CreditCard size={14} className="text-blue-500" />}
                      {titleCase(payment?.Method) || "-"}
                    </span>
                  }
                />
                <Fact
                  label="Type"
                  value={isCod ? "Pay on Delivery" : "Online"}
                />
                <Fact
                  label="Created"
                  value={payment?.CreatedAt ? formatDateTime(payment.CreatedAt) : "-"}
                />
              </div>

              <div className="border-t border-gray-100 pt-1">
                <CopyRow label="Payment Code" value={payment?.PaymentCode} />
              </div>

              {/* Gateway reference IDs - what support pastes into Razorpay /
                  a dispute ticket. Hidden for COD (no gateway transaction)
                  and until there's an actual Payment ID - a gateway Order ID
                  alone just means checkout was opened, not that anything
                  worth looking up in Razorpay exists yet. */}
              {!isCod && paymentId && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1">
                    Razorpay References
                  </p>
                  <p className="text-[11px] text-gray-400 mb-2 leading-relaxed">
                    Razorpay's own internal IDs for this transaction, separate from the order code
                    above. Paste these into the Razorpay dashboard to look this transaction up there.
                  </p>
                  <div className="bg-gray-50 rounded-xl px-3.5 divide-y divide-gray-100">
                    <CopyRow label="Order ID" value={gatewayOrderId} />
                    <CopyRow label="Payment ID" value={paymentId} />
                  </div>
                </div>
              )}

              {/* Failure reason surfaces only when the payment actually failed. */}
              {payment?.FailureReason && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-rose-500 mb-1">
                    Failure Reason
                  </p>
                  <p className="text-sm text-rose-700 break-words leading-relaxed">{payment.FailureReason}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-5 pb-5 pt-1 shrink-0">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
