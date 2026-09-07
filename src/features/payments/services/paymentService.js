import api from "../../../services/api.js";

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
