import api from "../../../services/api.js";
import { triggerCsvDownload } from "../../../utils/csvDownload.js";

export async function getOrders(params) {
  const response = await api.get("/admin/orders", { params });
  return response.data;
}

export async function getPaymentByOrderId(orderId) {
  const response = await api.get(`/payments/order/${orderId}`);
  return response.data;
}

export async function getRefunds(paymentId) {
  const response = await api.get(`/payments/${paymentId}/refund`);
  return Array.isArray(response.data) ? response.data : [];
}

export async function issueRefund(paymentId, payload) {
  const response = await api.post(`/payments/${paymentId}/refund`, payload);
  return response.data;
}

export async function overridePaymentStatus(paymentId, payload) {
  const response = await api.patch(`/payments/${paymentId}/status`, payload);
  return response.data;
}

export async function syncPayment(paymentId) {
  const response = await api.post("/payments/sync", { payment_id: paymentId });
  return response.data;
}

/** Row-level CSV export of raw Payment rows (GET /admin/payments/export) -
 * distinct from this page's own order-derived payment_status filter
 * (advance_pending/fully_paid/...), since the export is against
 * Payment.Status (the gateway transaction status: initiated/success/
 * failed/refunded), a different value domain - kept unfiltered by design
 * rather than mistranslating one into the other. */
export async function exportPaymentsCsv() {
  const response = await api.get("/admin/payments/export", { responseType: "blob" });
  triggerCsvDownload(response, `bmd_payments_${new Date().toISOString().slice(0, 10)}.csv`);
}
