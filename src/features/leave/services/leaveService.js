import api from "../../../services/api.js";

export async function getLeaveRequests(params) {
  const response = await api.get("/admin/leave-requests", { params });
  return response.data;
}

export async function approveLeaveRequest(requestId, adminNotes) {
  const response = await api.patch(`/admin/leave-requests/${requestId}/approve`, {
    admin_notes: adminNotes || undefined,
  });
  return response.data;
}

export async function rejectLeaveRequest(requestId, adminNotes) {
  const response = await api.patch(`/admin/leave-requests/${requestId}/reject`, {
    admin_notes: adminNotes,
  });
  return response.data;
}
