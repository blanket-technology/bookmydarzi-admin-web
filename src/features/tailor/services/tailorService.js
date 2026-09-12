import api from "../../../services/api.js";

export async function getTailors() {
  const response = await api.get("/admin/tailors");
  return Array.isArray(response.data) ? response.data : [];
}

export async function getTailorWorkload() {
  const response = await api.get("/admin/tailors/workload");
  return Array.isArray(response.data) ? response.data : [];
}

export async function getTailorById(tailorId) {
  const response = await api.get(`/admin/tailors/${tailorId}`);
  return response.data;
}

export async function updateTailor(tailorId, payload) {
  const response = await api.patch(`/admin/tailors/${tailorId}`, payload);
  return response.data;
}

export async function deleteTailor(tailorId) {
  await api.delete(`/admin/tailors/${tailorId}`);
}

export async function registerTailor(formData) {
  const response = await api.post("/tailor/apply", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

// Immediate admin-created tailor account (POST /admin/staff, role=tailor) -
// distinct from registerTailor() above, which submits to the public
// application queue instead. This is what the Add Tailor screen uses: the
// account is live right away, same as Add Bridge/employee.
export async function createTailorStaff(payload) {
  const response = await api.post("/admin/staff", payload);
  return response.data;
}

export async function uploadTailorKyc(tailorId, docType, file) {
  const fd = new FormData();
  fd.append("document_type", docType);
  fd.append("file", file);
  const response = await api.post(`/admin/tailors/${tailorId}/kyc`, fd);
  return response.data;
}

export async function deleteTailorKyc(tailorId, documentType) {
  await api.delete(`/admin/tailors/${tailorId}/kyc`, { params: { document_type: documentType } });
}

export async function uploadUserPhoto(userId, file) {
  const fd = new FormData();
  fd.append("file", file);
  const response = await api.post(`/admin/users/${userId}/photo`, fd);
  return response.data;
}

export async function getTailorOrders({ tailorId, page, limit, status }) {
  const response = await api.get("/admin/orders", {
    params: {
      tailor_id: tailorId,
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

export async function getApplications(params) {
  const response = await api.get("/admin/tailor-applications", { params });
  return response.data;
}

export async function getApplicationById(id) {
  const response = await api.get(`/admin/tailor-applications/${id}`);
  return response.data;
}

export async function approveApplication(applicationId, overridePan = false, panWaiverReason = "") {
  const response = await api.patch(
    `/admin/tailor-applications/${applicationId}/approve`,
    {
      override_pan_requirement: overridePan,
      ...(overridePan ? { pan_waiver_reason: panWaiverReason } : {}),
    },
  );
  return response.data;
}

export async function rejectApplication(applicationId, reason) {
  const response = await api.patch(
    `/admin/tailor-applications/${applicationId}/reject`,
    { reason },
  );
  return response.data;
}
