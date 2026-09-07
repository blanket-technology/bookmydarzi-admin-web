import api from "../../../services/api.js";

export async function getHomeBanners() {
  // The admin management endpoint, not the public /home payload - GET /home's
  // BannerResponse omits ValidUntil/IsActive entirely and pre-filters out
  // expired/inactive banners, so the admin table could never show a Valid
  // Until date (or an expired/disabled banner) when reading from it.
  const response = await api.get("/admin/homepage/banners");
  return Array.isArray(response.data) ? response.data : [];
}

export async function createBanner(payload) {
  const response = await api.post("/admin/homepage/banners", payload);
  return response.data;
}

export async function updateBanner(id, payload) {
  const response = await api.patch(`/admin/homepage/banners/${id}`, payload);
  return response.data;
}

export async function deleteBanner(id) {
  await api.delete(`/admin/homepage/banners/${id}`);
}

export async function getLookbookItems(params) {
  const response = await api.get("/lookbook", { params });
  return Array.isArray(response.data) ? response.data : [];
}

export async function createLookbookItem(payload) {
  const response = await api.post("/admin/lookbook", payload);
  return response.data;
}

export async function updateLookbookItem(id, payload) {
  const response = await api.patch(`/admin/lookbook/${id}`, payload);
  return response.data;
}

export async function deleteLookbookItem(id) {
  await api.delete(`/admin/lookbook/${id}`);
}
