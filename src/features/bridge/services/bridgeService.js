import api from "../../../services/api.js";
import { DEFAULT_PASSWORD } from "../constants/bridgeConstants.js";

export async function getBridgeStaff() {
  const response = await api.get("/admin/staff", { params: { role: "employee" } });
  return Array.isArray(response.data) ? response.data : [];
}

export async function toggleStaffStatus(staffId, isActive) {
  await api.patch(`/admin/users/${staffId}/status`, {
    action: isActive ? "deactivate" : "activate",
  });
}

export async function createBridgeEmployee(payload) {
  const response = await api.post("/admin/staff", payload);
  return response.data;
}

export async function updateBridgeProfile(staffId, payload) {
  const response = await api.patch(`/admin/staff/${staffId}/bridge-profile`, payload);
  return response.data;
}

export async function getStaffById(staffId) {
  const response = await api.get(`/admin/staff/${staffId}`);
  return response.data;
}

export async function updateStaffAccount(staffId, payload) {
  const response = await api.patch(`/admin/staff/${staffId}`, payload);
  return response.data;
}

export async function uploadStaffKyc(staffId, docType, file) {
  const fd = new FormData();
  fd.append("document_type", docType);
  fd.append("file", file);
  const response = await api.post(`/admin/staff/${staffId}/kyc`, fd);
  return response.data;
}

export async function deleteStaffKyc(staffId, documentType) {
  await api.delete(`/admin/staff/${staffId}/kyc`, { params: { document_type: documentType } });
}

export async function toggleStaffVerification(staffId, isApproved) {
  const response = await api.patch(`/admin/staff/${staffId}/verification`, { is_approved: isApproved });
  return response.data;
}

export async function uploadUserPhoto(userId, file) {
  const fd = new FormData();
  fd.append("file", file);
  const response = await api.post(`/admin/users/${userId}/photo`, fd);
  return response.data;
}

export async function getEmployeeOrders({ employeeId, page, limit, status }) {
  const response = await api.get("/admin/orders", {
    params: {
      employee_id: employeeId,
      page,
      limit,
      status: status || undefined,
    },
  });
  return {
    orders: response.data?.orders ?? [],
    total: response.data?.total ?? 0,
  };
}

export async function getEmployeeOrderDetail(orderId) {
  const response = await api.get(`/employee/orders/${orderId}`);
  return response.data;
}

export async function patchEmployeeOrder(orderId, endpoint, body = {}) {
  const response = await api.patch(`/employee/orders/${orderId}/${endpoint}`, body);
  return response.data;
}

export async function postEmployeeMeasurement(orderId, payload) {
  const response = await api.post(`/employee/orders/${orderId}/measurement`, payload);
  return response.data;
}

export async function advanceOrderStatus(orderId, status) {
  const response = await api.patch(`/admin/orders/${orderId}/status`, { status });
  return response.data;
}


export function buildCreateEmployeePayload(form) {
  const nameParts = form.name.trim().split(" ");
  const firstName = nameParts[0] || form.name;
  const lastName = nameParts.slice(1).join(" ") || ".";
  const usedDefaultPassword = !form.password.trim();
  return {
    first_name: firstName,
    last_name: lastName,
    email: form.email,
    mobile: form.mobile,
    password: form.password.trim() || DEFAULT_PASSWORD,
    role: "employee",
    is_active: true,
    // The account must change this password on its first login - see
    // MustChangePassword on the backend User model. Only true when the
    // admin left the field blank and got the shared default; an admin-typed
    // password is trusted as intentional and never forces a reset.
    is_default_password: usedDefaultPassword,
  };
}