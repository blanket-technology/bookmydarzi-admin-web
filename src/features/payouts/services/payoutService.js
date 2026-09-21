import api from "../../../services/api.js";

export async function getPayouts(params) {
  const response = await api.get("/admin/payouts", { params });
  return response.data;
}

export async function getPayoutSummary(tailorId) {
  const response = await api.get(`/admin/payouts/summary/${tailorId}`);
  return response.data;
}

export async function markPayoutPaid(payoutId, payload) {
  const response = await api.patch(`/admin/payouts/${payoutId}/mark-paid`, payload);
  return response.data;
}

export async function getCommissionRates(tailorId) {
  const response = await api.get("/admin/commission-rates", {
    params: tailorId ? { tailor_id: tailorId } : undefined,
  });
  return Array.isArray(response.data) ? response.data : [];
}

export async function upsertCommissionRate(payload) {
  const response = await api.post("/admin/commission-rates", payload);
  return response.data;
}

export async function deleteCommissionRate(rateId) {
  await api.delete(`/admin/commission-rates/${rateId}`);
}
