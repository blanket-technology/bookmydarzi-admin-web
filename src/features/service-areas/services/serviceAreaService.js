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

// "Notify me" leads captured when a customer's booking is rejected as
// outside the current service area - see the backend's
// POST /location/service-area-interest (customer-facing) and this admin
// read endpoint.
export async function getServiceAreaInterests(params) {
  const response = await api.get("/location/admin/service-area-interests", { params });
  return response.data;
}
