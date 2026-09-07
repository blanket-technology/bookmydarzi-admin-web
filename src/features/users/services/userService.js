import api from "../../../services/api.js";

export async function getUsers(params) {
  const response = await api.get("/admin/users", { params });
  return response.data;
}

export async function createStaff(payload) {
  const response = await api.post("/admin/staff", payload);
  return response.data;
}

export async function getUserById(id) {
  const response = await api.get(`/admin/users/${id}`);
  return response.data;
}
