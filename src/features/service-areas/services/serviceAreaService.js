import api from "../../../services/api.js";

export async function getServiceAreas() {
  const response = await api.get("/location/admin/service-areas");
  return response.data;
}

export async function createServiceArea(payload) {
  const response = await api.post("/location/admin/service-areas", payload);
  return response.data;
}

export async function updateServiceArea(id, payload) {
  const response = await api.patch(`/location/admin/service-areas/${id}`, payload);
  return response.data;
}

export async function deleteServiceArea(id) {
  const response = await api.delete(`/location/admin/service-areas/${id}`);
  return response.data;
}
