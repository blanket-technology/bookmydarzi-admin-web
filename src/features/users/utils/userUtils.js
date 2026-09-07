import { STAFF_ROLES_BY_CREATOR } from "../constants/userConstants.js";

export function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  let pwd = "";
  for (let i = 0; i < 12; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  return pwd;
}

export function getAvailableStaffRoles(creatorRole) {
  const role = (creatorRole || "").toLowerCase();
  // Fail-closed: an unknown/unresolved creator role gets NO creatable roles,
  // not the admin set. The backend's _CREATABLE_BY is authoritative regardless,
  // but the UI must not offer role creation it can't justify. Matches the
  // fail-closed philosophy in constants/permissions.js.
  return STAFF_ROLES_BY_CREATOR[role] || [];
}

export function getActiveRoleLabel(roleFilter, roleOptions) {
  return roleOptions.find((r) => r.value === roleFilter)?.label || "All Roles";
}

export function buildUserListParams({ page, limit, debouncedSearch, roleFilter, statusFilter }) {
  const params = { page, limit };
  if (debouncedSearch) params.search = debouncedSearch;
  if (roleFilter) params.role = roleFilter;
  if (statusFilter) params.is_active = statusFilter;
  return params;
}

export function buildStaffPayload(form) {
  const payload = {
    first_name: form.first_name,
    last_name: form.last_name,
    email: form.email,
    mobile: form.mobile,
    password: form.password,
    role: form.role,
  };
  if (form.role === "tailor") {
    payload.specialization = form.specialization || undefined;
    payload.experience = form.experience !== "" ? Number(form.experience) : undefined;
    payload.location = form.location || undefined;
    payload.bio = form.bio || undefined;
  }
  return payload;
}
