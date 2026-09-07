import api from "../../../services/api.js";

export async function getNotifications(params) {
  const response = await api.get("/notifications", { params });
  return response.data;
}

export async function getUnreadCount() {
  const response = await api.get("/notifications/unread-count");
  return response.data;
}

export async function markNotificationRead(id) {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
}

export async function markAllNotificationsRead() {
  const response = await api.post("/notifications/read-all");
  return response.data;
}

export async function sendBroadcast(payload) {
  const response = await api.post("/admin/notifications/broadcast", payload);
  return response.data;
}
