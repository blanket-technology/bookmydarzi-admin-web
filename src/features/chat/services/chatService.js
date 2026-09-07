import api from "../../../services/api.js";

export async function getChatSessions(query) {
  const response = await api.get(`/admin/chat/sessions${query}`);
  return response.data;
}

export async function getChatAnalytics() {
  const response = await api.get("/admin/chat/analytics");
  return response.data;
}

export async function getAgentStatus() {
  const response = await api.get("/admin/agents/me/status");
  return response.data;
}

export async function updateAgentStatus(agentId, status) {
  const response = await api.patch(`/admin/agents/${agentId}/status?status=${status}`);
  return response.data;
}

export async function resolveChatSession(uuid) {
  const response = await api.post(`/admin/chat/sessions/${uuid}/resolve`);
  return response.data;
}

export async function getSessionMessages(uuid, limit) {
  const response = await api.get(`/admin/chat/sessions/${uuid}/messages?limit=${limit}`);
  return response.data;
}

export async function getQuickReplies() {
  const response = await api.get("/admin/chat/quick-replies");
  return response.data;
}

export async function assignSession(uuid, agentId) {
  const response = await api.post(`/admin/chat/sessions/${uuid}/assign`, null, {
    params: { agent_id: agentId },
  });
  return response.data;
}
