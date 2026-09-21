import api from "../../../services/api.js";
import { triggerCsvDownload } from "../../../utils/csvDownload.js";

export async function getUsers(params) {
  const response = await api.get("/admin/users", { params });
  return response.data;
}

/** Row-level CSV export (GET /admin/users/export) - reuses the same
 * role/is_active filters as the paginated list. */
export async function exportUsersCsv({ role, isActive } = {}) {
  const response = await api.get("/admin/users/export", {
    params: {
      role: role || undefined,
      is_active: isActive === "" || isActive == null ? undefined : isActive === "true",
    },
    responseType: "blob",
  });
  triggerCsvDownload(response, `bmd_users_${new Date().toISOString().slice(0, 10)}.csv`);
}

export async function createStaff(payload) {
  const response = await api.post("/admin/staff", payload);
  return response.data;
}

export async function getUserById(id) {
  const response = await api.get(`/admin/users/${id}`);
  return response.data;
}
