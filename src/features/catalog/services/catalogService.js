import api from "../../../services/api.js";

export async function getCatalogTree() {
  const response = await api.get("/catalog/admin/tree");
  return response.data;
}

export async function reorderCatalogItems(reorderPath, items, getId) {
  await api.post(reorderPath, {
    items: items.map((it, idx) => ({ id: getId(it), display_order: idx + 1 })),
  });
}

export async function createCategory(payload) {
  const response = await api.post("/catalog/categories", payload);
  return response.data;
}

export async function updateCategory(id, payload) {
  const response = await api.patch(`/catalog/categories/${id}`, payload);
  return response.data;
}

export async function deleteCategory(id) {
  await api.delete(`/catalog/categories/${id}`);
}

export async function createServiceLine(payload) {
  const response = await api.post("/catalog/service-lines", payload);
  return response.data;
}

export async function updateServiceLine(id, payload) {
  const response = await api.patch(`/catalog/service-lines/${id}`, payload);
  return response.data;
}

export async function deleteServiceLine(id) {
  await api.delete(`/catalog/service-lines/${id}`);
}

export async function createService(payload) {
  const response = await api.post("/catalog/services", payload);
  return response.data;
}

export async function updateService(id, payload) {
  const response = await api.patch(`/catalog/services/${id}`, payload);
  return response.data;
}

export async function deleteService(id) {
  await api.delete(`/catalog/services/${id}`);
}

// ── Service add-ons (optional, per-service extras a customer can add at
// booking time, e.g. Button Replacement for Shirt Repair) ─────────────────

export async function getServiceAddons(serviceId) {
  const response = await api.get(`/catalog/admin/services/${serviceId}/addons`);
  return response.data;
}

export async function createServiceAddon(serviceId, payload) {
  const response = await api.post(`/catalog/admin/services/${serviceId}/addons`, payload);
  return response.data;
}

export async function updateServiceAddon(serviceId, addonId, payload) {
  const response = await api.patch(`/catalog/admin/services/${serviceId}/addons/${addonId}`, payload);
  return response.data;
}

export async function deleteServiceAddon(serviceId, addonId) {
  await api.delete(`/catalog/admin/services/${serviceId}/addons/${addonId}`);
}
