import api from "../../../services/api.js";

export async function getOffers() {
  const response = await api.get("/admin/homepage/offers");
  return Array.isArray(response.data) ? response.data : [];
}

export async function createOffer(payload) {
  const response = await api.post("/admin/homepage/offers", payload);
  return response.data;
}

export async function updateOffer(id, payload) {
  const response = await api.patch(`/admin/homepage/offers/${id}`, payload);
  return response.data;
}

export async function deleteOffer(id) {
  await api.delete(`/admin/homepage/offers/${id}`);
}

export async function toggleOfferActive(id, isActive) {
  const response = await api.patch(`/admin/homepage/offers/${id}`, { is_active: isActive });
  return response.data;
}
