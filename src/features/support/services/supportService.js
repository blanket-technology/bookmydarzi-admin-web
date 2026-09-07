import api from "../../../services/api.js";

export async function getTickets(params) {
  const response = await api.get("/support/tickets", { params });
  return response.data;
}

export async function getChatSessions(params) {
  const response = await api.get("/admin/chat/sessions", { params });
  return response.data;
}

export async function resolveChatSession(uuid) {
  const response = await api.post(`/admin/chat/sessions/${uuid}/resolve`);
  return response.data;
}

export async function getFaqs(params) {
  const response = await api.get("/support/faqs", { params });
  return response.data;
}

export async function createFaq(payload) {
  const response = await api.post("/support/faqs", payload);
  return response.data;
}

export async function updateFaq(id, payload) {
  const response = await api.patch(`/support/faqs/${id}`, payload);
  return response.data;
}

export async function deleteFaq(id) {
  const response = await api.delete(`/support/faqs/${id}`);
  return response.data;
}
