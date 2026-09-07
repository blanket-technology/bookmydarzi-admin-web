import api from "../../../services/api.js";
import { SETTINGS_ENDPOINTS } from "../constants/settingsConstants.js";

export async function fetchBillingSettings() {
  const response = await api.get(SETTINGS_ENDPOINTS.BILLING);
  return response.data;
}

export async function updateBillingSettings(payload) {
  const response = await api.patch(SETTINGS_ENDPOINTS.BILLING, payload);
  return response.data;
}

export async function clearHomepageCache() {
  await api.post(SETTINGS_ENDPOINTS.CACHE_CLEAR);
}

export async function fetchAuditLogs(page, limit, filters = {}) {
  const params = { page, limit };
  // Server-side filters: who performed it, action type, and date range.
  if (filters.performed_by) params.performed_by = filters.performed_by;
  if (filters.action) params.action = filters.action;
  // date_from = start of that day; date_to = end of that day, so the whole
  // selected day is inclusive (a bare date would otherwise cut off at 00:00).
  if (filters.date_from) params.date_from = `${filters.date_from}T00:00:00`;
  if (filters.date_to) params.date_to = `${filters.date_to}T23:59:59`;
  const response = await api.get(SETTINGS_ENDPOINTS.AUDIT_LOGS, { params });
  return response.data;
}

export async function fetchAuditFilterOptions() {
  const response = await api.get(`${SETTINGS_ENDPOINTS.AUDIT_LOGS}/filters`);
  return response.data; // { actors: [{id,name,role}], actions: [...] }
}

export async function fetchAdminStaff() {
  const response = await api.get(SETTINGS_ENDPOINTS.STAFF, { params: { role: "admin" } });
  return Array.isArray(response.data) ? response.data : [];
}

export async function fetchRbacScreens() {
  const response = await api.get(SETTINGS_ENDPOINTS.RBAC_SCREENS);
  return response.data || [];
}

export async function fetchRbacPermissions() {
  const response = await api.get(SETTINGS_ENDPOINTS.RBAC_PERMISSIONS);
  return response.data || [];
}

export async function fetchEffectivePermissions(userId) {
  const response = await api.get(`/rbac/user-permissions/${userId}/effective`);
  return response.data;
}

export async function fetchLockoutStatus(userId) {
  const response = await api.get(`/rbac/user-permissions/${userId}/lockout-status`);
  return response.data;
}

export async function unlockAdminAccount(userId) {
  await api.post(`/rbac/user-permissions/${userId}/unlock`);
}

export async function grantPermission(payload) {
  await api.post("/rbac/user-permissions/grant", payload);
}

export async function revokePermission(payload) {
  await api.post("/rbac/user-permissions/revoke", payload);
}

export async function deletePermissionMapping(mappingId) {
  await api.delete(`/rbac/user-permissions/${mappingId}`);
}
