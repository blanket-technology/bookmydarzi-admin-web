import api from "../../../services/api.js";
import { getStoredUser } from "../../../store/authStore.jsx";
import { ROLES } from "../../../constants/permissions.js";
import { ORDERS_CACHE_KEY } from "../constants/orderConstants.js";

export async function getOrdersList({ endpoint, params }) {
  const response = await api.get(endpoint, { params });
  return response.data || {};
}

export async function cancelOrder(orderId, reason) {
  const response = await api.patch(`/admin/orders/${orderId}/cancel`, { reason });
  return response.data;
}

export async function getOrderById(orderId) {
  const response = await api.get(`/orders/${orderId}`);
  return response.data;
}

export async function getTailorsForFilter(role) {
  const endpoint = role === ROLES.EMPLOYEE ? "/employee/tailors" : "/admin/tailors";
  const response = await api.get(endpoint);
  return response.data || [];
}

export async function assignTailor(orderId, tailorId) {
  const response = await api.patch(`/admin/orders/${orderId}/assign-tailor`, {
    tailor_id: Number(tailorId),
  });
  return response.data;
}

export async function updateOrderNotes(orderId, payload) {
  const response = await api.patch(`/admin/orders/${orderId}/notes`, payload);
  return response.data;
}

export async function getOrderPhotos(orderId) {
  const response = await api.get(`/orders/${orderId}/photos`);
  return response.data || [];
}

export async function uploadOrderPhoto(orderId, formData) {
  const response = await api.post(`/orders/${orderId}/photos`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function getOrderTracking(orderId) {
  const response = await api.get(`/orders/${orderId}/tracking`);
  return response.data;
}

export async function getBroadcastStatus(orderId) {
  const response = await api.get(`/tailor/orders/${orderId}/broadcast/status`);
  return response.data;
}

export async function downloadOrderInvoice(orderId) {
  const response = await api.get(`/orders/${orderId}/invoice`, { responseType: "blob" });
  return response.data;
}

export async function refreshOrderFromList(order) {
  const response = await api.get("/admin/orders", {
    params: { search: order.OrderCode || order.Id },
  });
  const list = response.data.orders || [];
  return list.find((o) => o.Id === order.Id) || null;
}

export function resolveOrdersEndpoint() {
  const isTailor = (getStoredUser()?.Role || "").toLowerCase() === ROLES.TAILOR;
  return isTailor ? "/orders/my-orders" : "/admin/orders";
}

export function isTailorRole() {
  return (getStoredUser()?.Role || "").toLowerCase() === ROLES.TAILOR;
}

// Bridge/delivery staff - full order-management capability except
// cancellation, which is Admin/Superadmin only (see orderActions.js's
// cancel_order action and the backend's dedicated
// _require_admin_cancel_order dependency).
export function isEmployeeRole() {
  return (getStoredUser()?.Role || "").toLowerCase() === ROLES.EMPLOYEE;
}

export function cacheOrders(data) {
  try {
    sessionStorage.setItem(ORDERS_CACHE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

export function readCachedOrders() {
  try {
    const cached = sessionStorage.getItem(ORDERS_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}
