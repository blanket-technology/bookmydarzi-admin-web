import api from "../../../services/api.js";

export async function getCancellations(params) {
  const response = await api.get(`/admin/cancellations?${params}`);
  return response.data;
}

export async function getCancellationPolicy() {
  const response = await api.get("/admin/cancellation-policy");
  return response.data;
}
