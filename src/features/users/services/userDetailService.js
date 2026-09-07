import api from "../../../services/api.js";
import { AUDIT_LIMIT } from "../constants/userDetailConstants.js";

export async function fetchUserById(userId) {
  const response = await api.get(`/admin/users/${userId}`);
  return response.data;
}

export async function fetchUserOrders(userId, { page, limit, status }) {
  const response = await api.get("/admin/orders", {
    params: {
      customer_id: userId,
      page,
      limit,
      status: status || undefined,
    },
  });
  return {
    orders: response.data?.orders ?? [],
    total: response.data?.total ?? 0,
  };
}

export async function fetchUserAuditLogs(userId) {
  const response = await api.get("/admin/audit-logs", {
    params: { user_id: userId, limit: AUDIT_LIMIT },
  });
  return response.data?.items ?? [];
}

export async function fetchCustomerFullDetail(userId) {
  const response = await api.get(`/admin/customers/${userId}/full-detail`);
  return response.data;
}

export async function requestPasswordReset(email) {
  await api.post("/auth/forgot-password/request", { email });
}

export async function updateUserStatus(userId, action) {
  await api.patch(`/admin/users/${userId}/status`, { action });
}

export async function deleteUser(userId) {
  await api.delete(`/admin/users/${userId}`);
}

export async function resolveChatSession(uuid) {
  await api.post(`/admin/chat/sessions/${uuid}/resolve`);
}
